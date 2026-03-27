import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { MarcaService } from '../../../servicios/marca.service';

@Component({
  selector: 'app-marca-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marca-crear.html',
  styleUrls: ['./marca-crear.css'],
})
export class MarcaCrear implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private marcaService = inject(MarcaService);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario = '';

  marca = {
    marcaNombre: '',
  };

  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: ReturnType<typeof setTimeout> | null = null;

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
        const me = response?.datos ?? null;

        if (!me) {
          this.router.navigate(['/login']);
          return;
        }

        this.usuarioActual = me;
        this.rolUsuario = this.esAdmin(me.usuRol) ? 'ADMIN' : String(me.usuRol ?? 'Usuario');
        this.cdRef.detectChanges();
      },
      error: () => this.router.navigate(['/login']),
    });
  }

  private esAdmin(rol: string | null | undefined): boolean {
    const r = String(rol ?? '').trim().toLowerCase();
    return r === 'adm' || r === 'admin' || r.startsWith('admin') || r.includes('administrador');
  }

  esAdminUI(): boolean {
    return this.esAdmin(this.usuarioActual?.usuRol);
  }

  volver(): void {
    this.router.navigate(['/panel/marca-lista']);
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
      this.router.navigate(['/panel/marca-lista']);
    }, 2000);
  }

  guardarMarca(): void {
    if (this.cargando) return;

    if (!this.esAdminUI()) {
      this.mensajeError = 'Sin permisos: solo un administrador puede crear marcas.';
      this.cdRef.detectChanges();
      return;
    }

    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    const nombre = (this.marca.marcaNombre ?? '').trim();
    if (!nombre) {
      this.mensajeError = 'El nombre de la marca es obligatorio.';
      this.cdRef.detectChanges();
      return;
    }

    const dto = { marcaNombre: nombre };

    this.cargando = true;
    this.cdRef.detectChanges();

    this.marcaService.crear(dto).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeOk = 'Marca creada correctamente.';
        this.marca = { marcaNombre: '' };
        this.cdRef.detectChanges();

        this.abrirModalOkAuto('Marca creada correctamente.');
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al crear la marca.');
        this.cdRef.detectChanges();
      },
    });
  }

  private extraerMensajeError(err: any, porDefecto: string): string {
    if (!err) return porDefecto;

    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error && typeof err.error === 'object') {
      if (typeof err.error.mensaje === 'string' && err.error.mensaje.trim()) {
        return err.error.mensaje;
      }

      if (typeof err.error.message === 'string' && err.error.message.trim()) {
        return err.error.message;
      }

      if (typeof err.error.title === 'string' && err.error.title.trim()) {
        return err.error.title;
      }

      if (typeof err.error.detail === 'string' && err.error.detail.trim()) {
        return err.error.detail;
      }
    }

    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    return porDefecto;
  }
}