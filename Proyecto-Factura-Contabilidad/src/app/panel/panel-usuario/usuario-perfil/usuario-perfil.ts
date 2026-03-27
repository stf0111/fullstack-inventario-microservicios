import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { UsuarioService, UsuarioListadoDto, UsuarioEditarDto } from '../../../servicios/usuario.service';

@Component({
  selector: 'app-usuario-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-perfil.html',
  styleUrls: ['./usuario-perfil.css']
})
export class UsuarioPerfil implements OnInit {
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  me: UsuarioAutenticadoDto | null = null;
  rolTexto = '';

  usuario: UsuarioListadoDto = {
    usuId: 0,
    usuCedula: '',
    usuNombre: '',
    usuApellido: '',
    usuNombreCompleto: '',
    usuRol: '',
    usuEstado: true,
    createdAt: '',
    updatedAt: null
  };

  nuevaContrasena = '';
  confirmarContrasena = '';
  mostrarPassword = false;

  ngOnInit(): void {
    this.cargarPerfil();
  }

  volver(): void {
    this.router.navigate(['/panel/inicio']);
  }

  private cargarPerfil(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.authService.me().pipe(
      take(1),
      switchMap((response) => {
        const me = response?.datos;

        if (!me) {
          return of(null);
        }

        this.me = me;
        this.rolTexto = this.formatearRol(me.usuRol);

        return this.usuarioService.obtenerPorId(me.usuId).pipe(
          take(1),
          catchError(() => of(null))
        );
      })
    ).subscribe({
      next: (response) => {
        if (response?.datos) {
          this.usuario = response.datos;
        } else if (this.me) {
          const partes = this.separarNombreCompleto(this.me.usuNombreCompleto);

          this.usuario = {
            ...this.usuario,
            usuId: this.me.usuId,
            usuCedula: this.me.usuCedula,
            usuNombre: partes.nombre,
            usuApellido: partes.apellido,
            usuNombreCompleto: this.me.usuNombreCompleto ?? '',
            usuRol: this.me.usuRol,
            usuEstado: this.me.usuEstado,
            createdAt: '',
            updatedAt: null
          };
        }

        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.router.navigate(['/login']);
      }
    });
  }

  guardarCambios(): void {
    if (!this.validarFormulario()) return;

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    const pass = (this.nuevaContrasena ?? '').trim();

    const dto: UsuarioEditarDto = {
      usuCedula: this.usuario.usuCedula,
      usuNombre: (this.usuario.usuNombre ?? '').trim(),
      usuApellido: (this.usuario.usuApellido ?? '').trim(),
      usuRol: (this.usuario.usuRol ?? this.me?.usuRol ?? '').trim(),
      usuEstado: !!this.usuario.usuEstado,
      password: pass ? pass : null
    };

    this.usuarioService.editar(this.usuario.usuId, dto).pipe(take(1)).subscribe({
      next: () => this.onSuccess(),
      error: (err: any) => {
        if (err && err.status === 200) {
          this.onSuccess();
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al actualizar tu perfil.');
        this.cdRef.detectChanges();
      }
    });
  }

  private onSuccess(): void {
    this.cargando = false;
    this.mensajeOk = 'Perfil actualizado correctamente.';
    this.nuevaContrasena = '';
    this.confirmarContrasena = '';

    this.usuario.usuNombreCompleto = `${this.usuario.usuNombre} ${this.usuario.usuApellido}`.trim();
    this.rolTexto = this.formatearRol(this.usuario.usuRol);

    this.cdRef.detectChanges();
  }

  private validarFormulario(): boolean {
    if (!this.usuario.usuNombre || !this.usuario.usuNombre.trim()) {
      this.mensajeError = 'El nombre es obligatorio.';
      return false;
    }

    if (!this.usuario.usuApellido || !this.usuario.usuApellido.trim()) {
      this.mensajeError = 'El apellido es obligatorio.';
      return false;
    }

    const pass = (this.nuevaContrasena ?? '').trim();
    const conf = (this.confirmarContrasena ?? '').trim();

    if (pass) {
      if (pass.length < 8) {
        this.mensajeError = 'La contraseña debe tener mínimo 8 caracteres.';
        return false;
      }

      if (pass !== conf) {
        this.mensajeError = 'La confirmación de contraseña no coincide.';
        return false;
      }
    }

    this.mensajeError = '';
    return true;
  }

  private formatearRol(rol: string): string {
    const r = (rol ?? '').trim().toUpperCase();

    if (r === 'ADMIN') return 'Administrador';
    if (r === 'OPERADOR') return 'Operador';
    if (r === 'VENDEDOR') return 'Vendedor';

    return r || 'Sin rol';
  }

  private separarNombreCompleto(nombreCompleto: string): { nombre: string; apellido: string } {
    const texto = String(nombreCompleto ?? '').trim();

    if (!texto) {
      return { nombre: '', apellido: '' };
    }

    const partes = texto.split(/\s+/);

    if (partes.length === 1) {
      return { nombre: partes[0], apellido: '' };
    }

    const nombre = partes.slice(0, -1).join(' ');
    const apellido = partes.slice(-1).join(' ');

    return { nombre, apellido };
  }

  private extraerMensajeError(err: any, porDefecto: string): string {
    if (!err) return porDefecto;

    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error && typeof err.error === 'object') {
      const msg =
        (typeof err.error.mensaje === 'string' && err.error.mensaje) ||
        (typeof err.error.message === 'string' && err.error.message) ||
        (typeof err.error.title === 'string' && err.error.title) ||
        (typeof err.error.detail === 'string' && err.error.detail) ||
        '';

      if (msg) return msg;
    }

    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    return porDefecto;
  }
}