import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService } from '../servicios/auth.service';
import { UsuarioService } from '../servicios/usuario.service';

type LoginOk = {
  usuId: number;
  usuCedula: string;
  usuNombre: string;
  usuApellido: string;
  usuRol: string;
  usuEstado: boolean;
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private cdr = inject(ChangeDetectorRef);

  mensajeError = '';
  cargando = false;

  modoCambioContrasena = false;
  nuevaContrasenaError = '';

  private usuarioLogueado: LoginOk | null = null;

  loginForm = this.fb.group({
    cedula: ['', [Validators.required, Validators.minLength(8)]],
    contrasena: ['', [Validators.required, Validators.minLength(3)]],
    nuevaContrasena: [''],
    nuevaContrasena2: ['']
  });

  private ui(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }

  iniciarSesion(): void {
    if (this.cargando) return;
    if (this.modoCambioContrasena) return;

    this.mensajeError = '';
    this.nuevaContrasenaError = '';
    this.ui();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.mensajeError = 'Completa los campos correctamente.';
      this.ui();
      return;
    }

    const cedula = String(this.loginForm.value.cedula ?? '').trim();
    const password = String(this.loginForm.value.contrasena ?? '');

    this.cargando = true;
    this.ui();

    this.authService.login({
      usuCedula: cedula,
      password
    }).pipe(take(1)).subscribe({
      next: () => {
        this.authService.me().pipe(take(1)).subscribe({
          next: (response) => {
            const me = response?.datos;
            const usuId = Number(me?.usuId ?? 0);

            if (!me || !usuId) {
              this.cargando = false;
              this.mensajeError = 'No se pudo validar la sesión.';
              this.ui();
              return;
            }

            // Cargamos el usuario completo porque para editar contraseña
            // tu UsuarioService necesita usuNombre, usuApellido, usuRol y usuEstado
            this.usuarioService.obtenerPorId(usuId).pipe(take(1)).subscribe({
              next: (usuarioResponse) => {
                const usuario = usuarioResponse?.datos;

                if (!usuario) {
                  this.cargando = false;
                  this.mensajeError = 'No se pudo cargar la información del usuario.';
                  this.ui();
                  return;
                }

                this.usuarioLogueado = {
                  usuId: Number(usuario.usuId),
                  usuCedula: String(usuario.usuCedula ?? cedula),
                  usuNombre: String(usuario.usuNombre ?? ''),
                  usuApellido: String(usuario.usuApellido ?? ''),
                  usuRol: String(usuario.usuRol ?? ''),
                  usuEstado: Boolean(usuario.usuEstado)
                };

                if (password.startsWith('CTmp_')) {
                  this.modoCambioContrasena = true;
                  this.loginForm.controls.cedula.disable({ emitEvent: false });
                  this.loginForm.controls.contrasena.disable({ emitEvent: false });

                  this.cargando = false;
                  this.ui();
                  return;
                }

                this.cargando = false;
                this.ui();
                this.router.navigate(['/panel', 'inicio']);
              },
              error: (err) => {
                this.cargando = false;
                this.mensajeError =
                  typeof err?.error === 'string' && err.error.trim()
                    ? err.error
                    : err?.error?.mensaje || 'No se pudo cargar la información del usuario.';
                this.ui();
              }
            });
          },
          error: (err) => {
            this.cargando = false;
            this.mensajeError =
              typeof err?.error === 'string' && err.error.trim()
                ? err.error
                : err?.error?.mensaje || 'No se pudo validar la sesión. Intenta de nuevo.';
            this.ui();
          }
        });
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError =
          typeof err?.error === 'string' && err.error.trim()
            ? err.error
            : err?.error?.mensaje || 'Cédula o contraseña incorrectas.';
        this.ui();
      }
    });
  }

  olvidoContrasena(): void {
    this.mensajeError = 'Contacta al administrador o solicita un cambio de contraseña.';
    this.ui();
  }

  cancelarCambioContrasena(): void {
    if (this.cargando) return;

    this.modoCambioContrasena = false;
    this.nuevaContrasenaError = '';
    this.usuarioLogueado = null;

    this.loginForm.patchValue({
      nuevaContrasena: '',
      nuevaContrasena2: ''
    });

    this.loginForm.controls.cedula.enable({ emitEvent: false });
    this.loginForm.controls.contrasena.enable({ emitEvent: false });

    // Tu service actual tiene logout(): void
    this.authService.logout();
    this.ui();
  }

  cambiarContrasenaDefinitiva(): void {
    if (this.cargando) return;

    this.mensajeError = '';
    this.nuevaContrasenaError = '';
    this.ui();

    if (!this.usuarioLogueado) {
      this.nuevaContrasenaError = 'No hay usuario autenticado para actualizar.';
      this.ui();
      return;
    }

    const nueva1 = String(this.loginForm.value.nuevaContrasena ?? '').trim();
    const nueva2 = String(this.loginForm.value.nuevaContrasena2 ?? '').trim();

    if (nueva1.length < 6) {
      this.nuevaContrasenaError = 'La contraseña debe tener al menos 6 caracteres.';
      this.ui();
      return;
    }

    if (nueva1 !== nueva2) {
      this.nuevaContrasenaError = 'Las contraseñas no coinciden.';
      this.ui();
      return;
    }

    this.cargando = true;
    this.ui();

    this.usuarioService.editar(this.usuarioLogueado.usuId, {
      usuCedula: this.usuarioLogueado.usuCedula,
      usuNombre: this.usuarioLogueado.usuNombre,
      usuApellido: this.usuarioLogueado.usuApellido,
      usuRol: this.usuarioLogueado.usuRol,
      usuEstado: this.usuarioLogueado.usuEstado,
      password: nueva1
    }).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.modoCambioContrasena = false;

        this.loginForm.patchValue({
          nuevaContrasena: '',
          nuevaContrasena2: ''
        });

        this.loginForm.controls.cedula.enable({ emitEvent: false });
        this.loginForm.controls.contrasena.enable({ emitEvent: false });

        this.ui();
        this.router.navigate(['/panel', 'inicio']);
      },
      error: (err) => {
        if (err?.status === 200) {
          this.cargando = false;
          this.modoCambioContrasena = false;

          this.loginForm.patchValue({
            nuevaContrasena: '',
            nuevaContrasena2: ''
          });

          this.loginForm.controls.cedula.enable({ emitEvent: false });
          this.loginForm.controls.contrasena.enable({ emitEvent: false });

          this.ui();
          this.router.navigate(['/panel', 'inicio']);
          return;
        }

        this.cargando = false;
        this.nuevaContrasenaError =
          typeof err?.error === 'string' && err.error.trim()
            ? err.error
            : err?.error?.mensaje || 'No se pudo actualizar la contraseña.';
        this.ui();
      }
    });
  }
}