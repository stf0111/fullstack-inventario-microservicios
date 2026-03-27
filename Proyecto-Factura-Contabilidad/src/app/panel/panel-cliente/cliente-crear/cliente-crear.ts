import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ClienteService, ClienteCrearDto } from '../../../servicios/cliente.service';

type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

@Component({
  selector: 'app-cliente-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-crear.html',
  styleUrls: ['./cliente-crear.css'],
})
export class ClienteCrear implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  // Sesión + rol
  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  // Form
  cliente = {
    cliCedula: '',
    cliNombre: '',
    cliApellido: '',
    cliDireccion: '',
    cliCorreo: '',
    cliTelefono: '',
  };

  // Modal OK
  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: any = null;

  ngOnInit(): void {
    this.cargarSesion();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  private cargarSesion(): void {
    this.authService.me().pipe(take(1)).subscribe({
      next: (response) => {
        const me = response?.datos;

        if (!me || !this.esRolValido(me.usuRol)) {
          this.router.navigate(['/login']);
          return;
        }

        this.usuarioActual = me;
        this.rolUsuario = me.usuRol.toUpperCase() as RolApp;
        this.cdRef.detectChanges();
      },
      error: () => this.router.navigate(['/login']),
    });
  }

  private esRolValido(rol: string | null | undefined): rol is RolApp {
    const r = String(rol ?? '').trim().toUpperCase();
    return r === 'ADMIN' || r === 'OPERADOR' || r === 'VENDEDOR';
  }

  esAdminUI(): boolean {
    return this.rolUsuario === 'ADMIN';
  }

  volver(): void {
    this.router.navigate(['/panel/cliente-lista']);
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
    if (c === '9999999999') return true;

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

  private validarRucEC(ruc: string): boolean {
    const r = this.limpiarCedula(ruc);

    if (r.length !== 13) return false;

    const provincia = parseInt(r.substring(0, 2), 10);
    if (!((provincia > 0 && provincia <= 24) || provincia === 30)) return false;

    const tercerDigito = parseInt(r.charAt(2), 10);

    // Persona natural
    if (tercerDigito >= 0 && tercerDigito <= 5) {
      const establecimiento = r.substring(10, 13);
      if (establecimiento === '000') return false;

      return this.validarCedulaEC(r.substring(0, 10));
    }

    // Sociedad privada
    if (tercerDigito === 9) {
      const establecimiento = r.substring(10, 13);
      if (establecimiento === '000') return false;

      const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
      const digitos = r.split('').map(Number);
      const digitoVerificador = digitos[9];

      let total = 0;
      for (let i = 0; i < coeficientes.length; i++) {
        total += digitos[i] * coeficientes[i];
      }

      const residuo = total % 11;
      const calculado = residuo === 0 ? 0 : 11 - residuo;

      return calculado === digitoVerificador;
    }

    // Entidad pública
    if (tercerDigito === 6) {
      const establecimiento = r.substring(9, 13);
      if (establecimiento === '0000') return false;

      const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
      const digitos = r.split('').map(Number);
      const digitoVerificador = digitos[8];

      let total = 0;
      for (let i = 0; i < coeficientes.length; i++) {
        total += digitos[i] * coeficientes[i];
      }

      const residuo = total % 11;
      const calculado = residuo === 0 ? 0 : 11 - residuo;

      return calculado === digitoVerificador;
    }

    return false;
  }

  private validarCedulaORucEC(valor: string): boolean {
    const limpio = this.limpiarCedula(valor);

    if (limpio.length === 10) return this.validarCedulaEC(limpio);
    if (limpio.length === 13) return this.validarRucEC(limpio);

    return false;
  }

  // =========================
  // VALIDACIÓN TELÉFONO ECUADOR
  // =========================
  private limpiarTelefono(tel: string): string {
    return (tel ?? '').replace(/\D/g, '').trim();
  }

  validarTelefonoEC(tel: string): boolean {
    const t = this.limpiarTelefono(tel);
    if (!t) return false;

    if (t.startsWith('09')) return t.length === 10;
    if (t.startsWith('02')) return t.length === 9;

    return false;
  }

  // =========================
  // VALIDACIÓN EMAIL
  // =========================
  validarEmail(email: string): boolean {
    const e = (email ?? '').trim();
    if (!e) return false;

    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  }

  // =========================
  // MENSAJES
  // =========================
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

      if (message) return message;
    }

    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    return porDefecto;
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
      this.router.navigate(['/panel/cliente-lista']);
    }, 2000);
  }

  // =========================
  // GUARDAR CLIENTE
  // =========================
  guardarCliente(): void {
    if (this.cargando) return;

    if (!this.esAdminUI()) {
      this.setError('Sin permisos: solo un administrador puede crear clientes.');
      return;
    }

    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    const nombre = (this.cliente.cliNombre ?? '').trim();
    const apellido = (this.cliente.cliApellido ?? '').trim();

    if (!nombre) return this.setError('El nombre es obligatorio.');
    if (!apellido) return this.setError('El apellido es obligatorio.');

    const cedulaRaw = (this.cliente.cliCedula ?? '').trim();
    const cedula = this.limpiarCedula(cedulaRaw);

    if (cedulaRaw && !this.validarCedulaORucEC(cedula)) {
      return this.setError('La cédula o RUC ecuatoriano no es válido.');
    }

    const correo = (this.cliente.cliCorreo ?? '').trim();
    if (correo && !this.validarEmail(correo)) {
      return this.setError('El correo no es válido.');
    }

    const telRaw = (this.cliente.cliTelefono ?? '').trim();
    const tel = this.limpiarTelefono(telRaw);

    if (telRaw && !this.validarTelefonoEC(tel)) {
      return this.setError('Teléfono inválido: debe iniciar con 09 (10 dígitos) o 02 (9 dígitos).');
    }

    const direccion = (this.cliente.cliDireccion ?? '').trim();

    const dto: ClienteCrearDto = {
      cliCedula: cedulaRaw ? cedula : null,
      cliNombre: nombre,
      cliApellido: apellido,
      cliDireccion: direccion ? direccion : null,
      cliCorreo: correo ? correo : null,
      cliTelefono: telRaw ? tel : null,
    };

    this.cargando = true;
    this.cdRef.detectChanges();

    this.clienteService.crear(dto).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeOk = 'Cliente creado correctamente.';
        this.cdRef.detectChanges();

        this.cliente = {
          cliCedula: '',
          cliNombre: '',
          cliApellido: '',
          cliDireccion: '',
          cliCorreo: '',
          cliTelefono: '',
        };

        this.abrirModalOkAuto('Cliente creado correctamente.');
      },
      error: (err) => {
        if (err?.status === 200) {
          this.cargando = false;
          this.mensajeOk = 'Cliente creado correctamente.';
          this.cdRef.detectChanges();

          this.cliente = {
            cliCedula: '',
            cliNombre: '',
            cliApellido: '',
            cliDireccion: '',
            cliCorreo: '',
            cliTelefono: '',
          };

          this.abrirModalOkAuto('Cliente creado correctamente.');
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al crear el cliente.');
        this.cdRef.detectChanges();
      },
    });
  }
}