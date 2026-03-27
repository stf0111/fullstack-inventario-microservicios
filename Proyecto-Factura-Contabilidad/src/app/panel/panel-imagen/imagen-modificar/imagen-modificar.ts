import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ImagenService, ImagenListadoDto, ImagenEditarDto } from '../../../servicios/imagen.service';
import { ProductoService, ProductoListadoDto } from '../../../servicios/producto.service';

type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

@Component({
  selector: 'app-imagen-modificar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imagen-modificar.html',
  styleUrls: ['./imagen-modificar.css'],
})
export class ImagenModificar implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private imagenService = inject(ImagenService);
  private productoService = inject(ProductoService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  productos: ProductoListadoDto[] = [];

  imgId = 0;
  imagen: ImagenListadoDto | null = null;

  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: any = null;

  ngOnInit(): void {
    const pm = this.route.snapshot.paramMap;
    const qm = this.route.snapshot.queryParamMap;

    const raw =
      pm.get('imgId') ??
      pm.get('id') ??
      qm.get('imgId') ??
      qm.get('id');

    const id = raw != null ? Number(raw) : NaN;

    if (!Number.isFinite(id) || id <= 0) {
      this.mensajeError = 'ID de imagen inválido.';
      return;
    }

    this.imgId = id;
    this.cargarSesionYData();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  private cargarSesionYData(): void {
    this.authService.me().pipe(take(1)).subscribe({
      next: (response) => {
        const me = response?.datos;

        if (!me || !this.esRolValido(me.usuRol)) {
          this.router.navigate(['/login']);
          return;
        }

        this.usuarioActual = me;
        this.rolUsuario = me.usuRol.toUpperCase() as RolApp;

        this.cargarTodo();
      },
      error: () => this.router.navigate(['/login']),
    });
  }

  private cargarTodo(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    forkJoin({
      imagen: this.imagenService.obtenerPorId(this.imgId).pipe(take(1)),
      productos: this.productoService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
        take(1),
        map(r => r?.datos ?? []),
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ imagen, productos }) => {
        const img = imagen?.datos;

        if (!img) {
          this.cargando = false;
          this.mensajeError = 'No se pudo cargar la imagen.';
          this.cdRef.detectChanges();
          return;
        }

        this.imagen = { ...img };
        this.productos = Array.isArray(productos) ? productos : [];

        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al cargar la imagen.');
        this.cdRef.detectChanges();
      }
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
    this.router.navigate(['/panel/imagen-lista']);
  }

  private validarUrl(url: string): boolean {
    const valor = String(url ?? '').trim();
    if (!valor) return false;

    try {
      const u = new URL(valor);
      return u.protocol === 'http:' || u.protocol === 'https:';
    } catch {
      return false;
    }
  }

  guardarCambios(): void {
    if (!this.imagen) return;
    if (this.cargando) return;

    if (!this.esAdminUI()) {
      return this.setError('Sin permisos: solo un administrador puede modificar imágenes.');
    }

    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    const prodId = Number(this.imagen.prodId);
    const imgUrl = String(this.imagen.imgUrl ?? '').trim();
    const orden = Number(this.imagen.orden);

    if (!Number.isFinite(prodId) || prodId <= 0) {
      return this.setError('Seleccione un producto.');
    }

    if (!this.validarUrl(imgUrl)) {
      return this.setError('La URL de la imagen no es válida.');
    }

    if (!Number.isFinite(orden) || orden < 0) {
      return this.setError('El orden debe ser 0 o mayor.');
    }

    const dto: ImagenEditarDto = {
      prodId,
      imgNombre: (this.imagen.imgNombre ?? '').trim() || null,
      imgUrl,
      imgDescripcion: (this.imagen.imgDescripcion ?? '').trim() || null,
      esPrincipal: this.imagen.esPrincipal === true,
      orden,
      imgEstado: this.imagen.imgEstado === true
    };

    this.cargando = true;
    this.cdRef.detectChanges();

    this.imagenService.editar(this.imagen.imgId, dto).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeOk = 'Imagen actualizada correctamente.';
        this.cdRef.detectChanges();
        this.abrirModalOkAuto('Imagen actualizada correctamente.');
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.cargando = false;
          this.mensajeOk = 'Imagen actualizada correctamente.';
          this.cdRef.detectChanges();
          this.abrirModalOkAuto('Imagen actualizada correctamente.');
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al actualizar la imagen.');
        this.cdRef.detectChanges();
      }
    });
  }

  private abrirModalOkAuto(msg: string): void {
    this.modalOkMensaje = msg;
    this.modalOkVisible = true;
    this.cdRef.detectChanges();

    if (this.okTimer) clearTimeout(this.okTimer);

    this.okTimer = setTimeout(() => {
      this.modalOkVisible = false;
      this.modalOkMensaje = '';
      this.cdRef.detectChanges();
      this.router.navigate(['/panel/imagen-lista']);
    }, 2000);
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

      if (message) return message;
    }

    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    return porDefecto;
  }
}