import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { UsuarioService } from '../../../servicios/usuario.service';

type RolFijo = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

type RolDto = {
  rolId: number;
  rolNombre: RolFijo;
};

@Component({
  selector: 'app-usuario-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-crear.html',
  styleUrls: ['./usuario-crear.css'],
})
export class UsuarioCrear implements OnInit, OnDestroy {
  private usuarioService = inject(UsuarioService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  // Roles fijos
  roles: RolDto[] = [];
  rolesSeleccionados: number[] = [];

  private readonly rolesFijos: RolDto[] = [
    { rolId: 1, rolNombre: 'ADMIN' },
    { rolId: 2, rolNombre: 'OPERADOR' },
    { rolId: 3, rolNombre: 'VENDEDOR' }
  ];

  // Form
  usuario = {
    usuCedula: '',
    usuNombre: '',
    usuApellido: '',
    usuEstado: true,
  };

  // Password
  passwordManual = '';
  passwordGenerada: string | null = null;

  // Modal confirmación generar contraseña
  confirmVisible = false;
  confirmMensaje = '';
  confirmTipo: 'password' | null = null;

  // Modal mostrar contraseña
  modalPasswordVisible = false;

  // Modal OK
  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: any = null;

  ngOnInit(): void {
    this.cargarRoles();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  private abrirModalOkAuto(msg: string): void {
    this.modalOkMensaje = msg;
    this.modalOkVisible = true;
    this.cdRef.detectChanges();

    if (this.okTimer) {
      clearTimeout(this.okTimer);
    }

    this.okTimer = setTimeout(() => {
      this.modalOkVisible = false;
      this.modalOkMensaje = '';
      this.cdRef.detectChanges();
      this.router.navigate(['/panel/usuario-lista']);
    }, 2000);
  }

  // =========================
  // ROLES
  // =========================
  private cargarRoles(seleccionarId?: number, mantenerSeleccion = true): void {
    this.cargando = true;
    this.cdRef.detectChanges();

    const prevSel = [...this.rolesSeleccionados];
    this.roles = [...this.rolesFijos];

    const ids = new Set(this.roles.map(r => r.rolId));
    let sel = mantenerSeleccion ? prevSel.filter(id => ids.has(id)) : [];

    if (seleccionarId != null && ids.has(seleccionarId)) {
      sel = [seleccionarId];
    }

    if (sel.length === 0) {
      sel = [1];
    }

    if (sel.length > 1) {
      sel = [sel[0]];
    }

    this.rolesSeleccionados = sel;
    this.cargando = false;
    this.cdRef.detectChanges();
  }

  toggleRol(rolId: number): void {
    this.rolesSeleccionados = [rolId];
    this.cdRef.detectChanges();
  }

  // =========================
  // NAVEGACIÓN
  // =========================
  volver(): void {
    this.router.navigate(['/panel/usuario-lista']);
  }

  // =========================
  // VALIDACIÓN CÉDULA ECUATORIANA
  // =========================
  private limpiarCedula(cedula: string): string {
    return (cedula ?? '').replace(/\D/g, '').trim();
  }

  validarCedulaEC(cedula: string): boolean {
    const c = this.limpiarCedula(cedula);
    if (c.length !== 10) return false;

    const provincia = parseInt(c.substring(0, 2), 10);
    if (!((provincia > 0 && provincia <= 24) || provincia === 30)) return false;

    const digitos = c.split('').map(Number);
    const digitoVerificador = digitos[9];

    let sumaPares = 0;
    let sumaImpares = 0;

    for (let i = 0; i < 9; i += 2) {
      let valor = digitos[i] * 2;
      if (valor > 9) valor -= 9;
      sumaImpares += valor;
    }

    for (let i = 1; i < 8; i += 2) {
      sumaPares += digitos[i];
    }

    const total = sumaPares + sumaImpares;
    const decenaSuperior = Math.ceil(total / 10) * 10;
    const calculado = decenaSuperior - total;

    return calculado === digitoVerificador || (calculado === 10 && digitoVerificador === 0);
  }

  // =========================
  // GENERAR CONTRASEÑA
  // =========================
  abrirConfirmarGenerar(): void {
    this.confirmTipo = 'password';
    this.confirmMensaje =
      'Se generará una contraseña temporal con el patrón CTmp_A***** para este nuevo usuario. ¿Deseas continuar?';
    this.confirmVisible = true;
    this.cdRef.detectChanges();
  }

  cancelarConfirmacion(): void {
    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.confirmTipo = null;
    this.cdRef.detectChanges();
  }

  confirmarAccion(): void {
    const tipo = this.confirmTipo;

    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.confirmTipo = null;
    this.cdRef.detectChanges();

    if (tipo === 'password') {
      this.ejecutarGenerarContrasena();
    }
  }

  private ejecutarGenerarContrasena(): void {
    const nuevaPass = this.generarPasswordTemporal();
    this.passwordGenerada = nuevaPass;
    this.passwordManual = nuevaPass;
    this.modalPasswordVisible = true;
    this.cdRef.detectChanges();
  }

  private generarPasswordTemporal(): string {
    const prefix = 'CTmp_A';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';

    for (let i = 0; i < 5; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return prefix + suffix;
  }

  cerrarModalPassword(): void {
    this.modalPasswordVisible = false;
    this.cdRef.detectChanges();
  }

  // =========================
  // GUARDAR USUARIO
  // =========================
  guardarUsuario(): void {
    this.mensajeError = '';
    this.mensajeOk = '';

    const ced = this.limpiarCedula(this.usuario.usuCedula);
    if (!ced) return this.setError('La cédula es obligatoria.');
    if (!this.validarCedulaEC(ced)) return this.setError('La cédula ecuatoriana no es válida.');
    if (!this.usuario.usuNombre?.trim()) return this.setError('El nombre es obligatorio.');
    if (!this.usuario.usuApellido?.trim()) return this.setError('El apellido es obligatorio.');

    const pass = (this.passwordManual ?? '').trim();
    if (!pass) return this.setError('La contraseña es obligatoria (puedes generarla).');

    if (!this.rolesSeleccionados.length) {
      return this.setError('Debes seleccionar un rol.');
    }

    const rolSeleccionado = this.roles.find(r => r.rolId === this.rolesSeleccionados[0]);
    if (!rolSeleccionado) {
      return this.setError('Debes seleccionar un rol válido.');
    }

    const dtoUsuario = {
      usuCedula: ced,
      usuNombre: this.usuario.usuNombre.trim(),
      usuApellido: this.usuario.usuApellido.trim(),
      usuRol: rolSeleccionado.rolNombre,
      usuEstado: true,
      password: pass
    };

    this.cargando = true;
    this.cdRef.detectChanges();

    this.usuarioService.crear(dtoUsuario).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeOk = 'Usuario creado correctamente.';

        this.usuario = {
          usuCedula: '',
          usuNombre: '',
          usuApellido: '',
          usuEstado: true
        };

        this.passwordManual = '';
        this.passwordGenerada = null;

        this.cargarRoles(1, false);
        this.cdRef.detectChanges();

        this.abrirModalOkAuto('Usuario creado correctamente.');
      },
      error: (err: any) => {
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al crear el usuario.');
        this.cdRef.detectChanges();
      }
    });
  }

  private setError(msg: string): void {
    this.mensajeError = msg;
    this.cdRef.detectChanges();
  }

  private extraerMensajeError(err: any, porDefecto: string): string {
    if (!err) return porDefecto;

    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error && typeof err.error === 'object') {
      const message =
        (typeof err.error.mensaje === 'string' && err.error.mensaje) ||
        (typeof err.error.message === 'string' && err.error.message) ||
        (typeof err.error.title === 'string' && err.error.title) ||
        (typeof err.error.detail === 'string' && err.error.detail) ||
        '';

      if (message) {
        return message;
      }
    }

    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    return porDefecto;
  }
}