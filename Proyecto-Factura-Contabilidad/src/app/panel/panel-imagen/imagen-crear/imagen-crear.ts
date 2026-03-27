import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { map, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ImagenService, ImagenCrearDto } from '../../../servicios/imagen.service';
import { ProductoService, ProductoListadoDto } from '../../../servicios/producto.service';

type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

@Component({
  selector: 'app-imagen-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imagen-crear.html',
  styleUrls: ['./imagen-crear.css'],
})
export class ImagenCrear implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private imagenService = inject(ImagenService);
  private productoService = inject(ProductoService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  productos: ProductoListadoDto[] = [];

  imagen = {
    prodId: null as number | null,
    imgNombre: '',
    imgUrl: '',
    imgDescripcion: '',
    esPrincipal: false,
    orden: 1,
    imgEstado: true
  };

  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: any = null;

  ngOnInit(): void {
    this.cargarSesionYProductos();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  private cargarSesionYProductos(): void {
    this.authService.me().pipe(take(1)).subscribe({
      next: (response) => {
        const me = response?.datos;

        if (!me || !this.esRolValido(me.usuRol)) {
          this.router.navigate(['/login']);
          return;
        }

        this.usuarioActual = me;
        this.rolUsuario = me.usuRol.toUpperCase() as RolApp;

        this.cargarProductos();
      },
      error: () => this.router.navigate(['/login']),
    });
  }

  private cargarProductos(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.productoService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
      take(1),
      map(r => r?.datos ?? []),
      catchError(() => of([]))
    ).subscribe({
      next: (lista) => {
        this.productos = Array.isArray(lista) ? lista : [];
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.productos = [];
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'No se pudieron cargar los productos.');
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

  guardarImagen(): void {
    if (this.cargando) return;

    if (!this.esAdminUI()) {
      this.setError('Sin permisos: solo un administrador puede crear imágenes.');
      return;
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

    const dto: ImagenCrearDto = {
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

    this.imagenService.crear(dto).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeOk = 'Imagen creada correctamente.';
        this.cdRef.detectChanges();

        this.imagen = {
          prodId: null,
          imgNombre: '',
          imgUrl: '',
          imgDescripcion: '',
          esPrincipal: false,
          orden: 1,
          imgEstado: true
        };

        this.abrirModalOkAuto('Imagen creada correctamente.');
      },
      error: (err) => {
        if (err?.status === 200) {
          this.cargando = false;
          this.mensajeOk = 'Imagen creada correctamente.';
          this.cdRef.detectChanges();

          this.imagen = {
            prodId: null,
            imgNombre: '',
            imgUrl: '',
            imgDescripcion: '',
            esPrincipal: false,
            orden: 1,
            imgEstado: true
          };

          this.abrirModalOkAuto('Imagen creada correctamente.');
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al crear la imagen.');
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