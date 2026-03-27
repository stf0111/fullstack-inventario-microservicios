import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { UsuarioService, UsuarioListadoDto, UsuarioEditarDto } from '../../../servicios/usuario.service';

type RolFijo = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

type RolDto = {
  rolId: number;
  rolNombre: RolFijo;
};

@Component({
  selector: 'app-usuario-modificar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-modificar.html',
  styleUrls: ['./usuario-modificar.css']
})
export class UsuarioModificar implements OnInit, OnDestroy {
  private usuarioService = inject(UsuarioService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);
  private okTimer: any = null;

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  // Modal OK
  modalOkVisible = false;
  modalOkMensaje = '';

  usuId = 0;

  usuario: UsuarioListadoDto | null = null;

  // Roles fijos
  roles: RolDto[] = [
    { rolId: 1, rolNombre: 'ADMIN' },
    { rolId: 2, rolNombre: 'OPERADOR' },
    { rolId: 3, rolNombre: 'VENDEDOR' }
  ];

  rolesSeleccionados: number[] = [];
  rolesIniciales: number[] = [];

  ngOnInit(): void {
    const pm = this.route.snapshot.paramMap;
    const qm = this.route.snapshot.queryParamMap;

    const raw =
      pm.get('usuId') ??
      pm.get('id') ??
      qm.get('usuId') ??
      qm.get('id');

    const id = raw ? Number(raw) : NaN;

    if (!Number.isFinite(id) || id <= 0) {
      this.mensajeError = 'ID de usuario inválido.';
      return;
    }

    this.usuId = id;
    this.cargarTodo();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  // =========================
  // CARGA INICIAL
  // =========================
  private cargarTodo(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.usuarioService.obtenerPorId(this.usuId).pipe(take(1)).subscribe({
      next: (response) => {
        const usuario = response?.datos;

        if (!usuario) {
          this.cargando = false;
          this.mensajeError = 'No se encontró el usuario.';
          this.cdRef.detectChanges();
          return;
        }

        this.usuario = usuario;

        const rolActual = String(usuario.usuRol ?? '').trim().toUpperCase();
        const rolMatch = this.roles.find(r => r.rolNombre === rolActual);

        if (rolMatch) {
          this.rolesIniciales = [rolMatch.rolId];
          this.rolesSeleccionados = [rolMatch.rolId];
        } else {
          this.rolesIniciales = [];
          this.rolesSeleccionados = [];
        }

        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al cargar el usuario.');
        this.cdRef.detectChanges();
      }
    });
  }

  // =========================
  // ROLES UI
  // =========================
  toggleRol(rolId: number): void {
    this.rolesSeleccionados = [rolId];
    this.cdRef.detectChanges();
  }

  private obtenerRolSeleccionado(): RolDto | null {
    const rolId = this.rolesSeleccionados[0];
    return this.roles.find(r => r.rolId === rolId) ?? null;
  }

  // =========================
  // GUARDAR CAMBIOS
  // =========================
  guardarCambios(): void {
    if (!this.usuario) return;

    this.mensajeError = '';
    this.mensajeOk = '';

    if (!this.usuario.usuNombre?.trim()) {
      return this.setError('El nombre es obligatorio.');
    }

    if (!this.usuario.usuApellido?.trim()) {
      return this.setError('El apellido es obligatorio.');
    }

    if (!this.rolesSeleccionados.length) {
      return this.setError('Selecciona un rol.');
    }

    const rolSeleccionado = this.obtenerRolSeleccionado();
    if (!rolSeleccionado) {
      return this.setError('Selecciona un rol válido.');
    }

    this.cargando = true;
    this.cdRef.detectChanges();

    const dto: UsuarioEditarDto = {
      usuCedula: this.usuario.usuCedula,
      usuNombre: this.usuario.usuNombre.trim(),
      usuApellido: this.usuario.usuApellido.trim(),
      usuRol: rolSeleccionado.rolNombre,
      usuEstado: !!this.usuario.usuEstado,
      password: null
    };

    this.usuarioService.editar(this.usuId, dto).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeOk = 'Usuario actualizado correctamente.';

        this.rolesIniciales = [...this.rolesSeleccionados];
        if (this.usuario) {
          this.usuario.usuRol = rolSeleccionado.rolNombre;
        }

        this.cdRef.detectChanges();
        this.abrirModalOk('Usuario actualizado correctamente.');
      },
      error: (err) => {
        if (err && err.status === 200) {
          this.cargando = false;
          this.mensajeOk = 'Usuario actualizado correctamente.';

          this.rolesIniciales = [...this.rolesSeleccionados];
          if (this.usuario) {
            this.usuario.usuRol = rolSeleccionado.rolNombre;
          }

          this.cdRef.detectChanges();
          this.abrirModalOk('Usuario actualizado correctamente.');
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al actualizar el usuario.');
        this.cdRef.detectChanges();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/panel/usuario-lista']);
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

  private abrirModalOk(msg: string): void {
    this.modalOkMensaje = msg;
    this.modalOkVisible = true;
    this.cdRef.detectChanges();

    if (this.okTimer) {
      clearTimeout(this.okTimer);
    }

    this.okTimer = setTimeout(() => {
      this.cerrarModalOkYVolver();
    }, 2000);
  }

  cerrarModalOkYVolver(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }

    this.modalOkVisible = false;
    this.modalOkMensaje = '';
    this.cdRef.detectChanges();
    this.router.navigate(['/panel/usuario-lista']);
  }
}