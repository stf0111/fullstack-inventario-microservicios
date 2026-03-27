import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ImagenService, ImagenListadoDto } from '../../../servicios/imagen.service';
import { ProductoService, ProductoListadoDto } from '../../../servicios/producto.service';

type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';
type EstadoFiltro = 'ACTIVAS' | 'INACTIVAS' | 'TODAS';
type PrincipalFiltro = 'TODAS' | 'PRINCIPALES' | 'SECUNDARIAS';

@Component({
  selector: 'app-imagen-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './imagen-lista.html',
  styleUrls: ['./imagen-lista.css'],
})
export class ImagenLista implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private imagenService = inject(ImagenService);
  private productoService = inject(ProductoService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  imagenes: ImagenListadoDto[] = [];
  productos: ProductoListadoDto[] = [];

  terminoBusqueda = '';
  filtroProductoId: number | null = null;
  filtroEstado: EstadoFiltro = 'TODAS';
  filtroPrincipal: PrincipalFiltro = 'TODAS';

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  paginaActual = 1;
  tamanoPagina = 12;

  confirmVisible = false;
  confirmTitulo = 'Eliminar imagen';
  confirmMensaje = '';
  imagenSeleccionada: ImagenListadoDto | null = null;

  modalDetalleVisible = false;

  private okTimer: any = null;

  get imagenesFiltradas(): ImagenListadoDto[] {
    let lista = [...this.imagenes];

    const t = this.terminoBusqueda.trim().toLowerCase();
    if (t) {
      lista = lista.filter((img) => {
        const id = this.obtenerCodigo(img).toLowerCase();
        const prod = this.obtenerProductoTexto(img).toLowerCase();
        const nom = this.obtenerNombre(img).toLowerCase();
        const url = this.obtenerUrl(img).toLowerCase();
        const desc = this.obtenerDescripcion(img).toLowerCase();

        return id.includes(t) || prod.includes(t) || nom.includes(t) || url.includes(t) || desc.includes(t);
      });
    }

    if (this.filtroProductoId != null) {
      lista = lista.filter(x => Number(x?.prodId ?? 0) === Number(this.filtroProductoId));
    }

    if (this.filtroEstado === 'ACTIVAS') {
      lista = lista.filter(x => this.esActiva(x));
    }

    if (this.filtroEstado === 'INACTIVAS') {
      lista = lista.filter(x => !this.esActiva(x));
    }

    if (this.filtroPrincipal === 'PRINCIPALES') {
      lista = lista.filter(x => x?.esPrincipal === true);
    }

    if (this.filtroPrincipal === 'SECUNDARIAS') {
      lista = lista.filter(x => x?.esPrincipal !== true);
    }

    return lista;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.imagenesFiltradas.length / this.tamanoPagina));
  }

  get imagenesPaginaActual(): ImagenListadoDto[] {
    const datos = this.imagenesFiltradas;
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return datos.slice(inicio, inicio + this.tamanoPagina);
  }

  ngOnInit(): void {
    this.cargarSesionYData();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  private cargarSesionYData(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.authService.me().pipe(take(1)).subscribe({
      next: (response) => {
        const me = response?.datos;

        if (!me || !this.esRolValido(me.usuRol)) {
          this.cargando = false;
          this.router.navigate(['/login']);
          return;
        }

        this.usuarioActual = me;
        this.rolUsuario = me.usuRol.toUpperCase() as RolApp;

        this.cargarData();
      },
      error: () => {
        this.cargando = false;
        this.router.navigate(['/login']);
      }
    });
  }

  private cargarData(mantenerMensajes = false): void {
    this.cargando = true;

    if (!mantenerMensajes) {
      this.mensajeError = '';
      this.mensajeOk = '';
    }

    this.cdRef.detectChanges();

    forkJoin({
      imagenes: this.imagenService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
        take(1),
        catchError(() => of({ datos: [] }))
      ),
      productos: this.productoService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
        take(1),
        map(r => r?.datos ?? []),
        catchError(() => of([]))
      )
    }).subscribe({
      next: ({ imagenes, productos }) => {
        this.imagenes = Array.isArray(imagenes?.datos) ? imagenes.datos : [];
        this.productos = Array.isArray(productos) ? productos : [];
        this.paginaActual = 1;
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.imagenes = [];
        this.productos = [];
        this.paginaActual = 1;
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'No se pudieron cargar las imágenes.');
        this.cdRef.detectChanges();
      }
    });
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroProductoId = null;
    this.filtroEstado = 'TODAS';
    this.filtroPrincipal = 'TODAS';
    this.paginaActual = 1;
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  private esRolValido(rol: string | null | undefined): rol is RolApp {
    const r = String(rol ?? '').trim().toUpperCase();
    return r === 'ADMIN' || r === 'OPERADOR' || r === 'VENDEDOR';
  }

  esAdminUI(): boolean {
    return this.rolUsuario === 'ADMIN';
  }

  mostrarBotonModificar(): boolean {
    return this.esAdminUI();
  }

  obtenerCodigo(x: ImagenListadoDto): string {
    return String(x?.imgId ?? '');
  }

  obtenerProductoTexto(x: ImagenListadoDto): string {
    if (x?.prodNombre) return String(x.prodNombre);
    const p = this.productos.find(y => Number(y?.prodId ?? 0) === Number(x?.prodId ?? 0));
    return String(p?.prodNombre ?? `Producto ${x?.prodId ?? ''}`);
  }

  obtenerNombre(x: ImagenListadoDto): string {
    return String(x?.imgNombre ?? '').trim() || '(sin nombre)';
  }

  obtenerUrl(x: ImagenListadoDto): string {
    return String(x?.imgUrl ?? '');
  }

  obtenerDescripcion(x: ImagenListadoDto): string {
    return String(x?.imgDescripcion ?? '').trim() || '-';
  }

  obtenerTextoPrincipal(x: ImagenListadoDto): string {
    return x?.esPrincipal ? 'Sí' : 'No';
  }

  obtenerTextoEstado(x: ImagenListadoDto): string {
    return this.esActiva(x) ? 'Activa' : 'Inactiva';
  }

  esActiva(x: ImagenListadoDto): boolean {
    return x?.imgEstado === true;
  }

  obtenerClasesPrincipal(x: ImagenListadoDto): string {
    return x?.esPrincipal
      ? 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600'
      : 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600';
  }

  obtenerClasesEstado(x: ImagenListadoDto): string {
    return this.esActiva(x)
      ? 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-600'
      : 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-rose-50 text-rose-600';
  }

  nuevaImagen(): void {
    if (!this.esAdminUI()) return;
    this.router.navigate(['/panel/imagen-crear']);
  }

  modificarImagen(x: ImagenListadoDto): void {
    if (!this.esAdminUI()) return;

    const id = Number(x?.imgId);
    if (!Number.isFinite(id)) return;

    this.router.navigate(['/panel/imagen-modificar', id]);
  }

  verDetalle(x: ImagenListadoDto): void {
    this.imagenSeleccionada = x;
    this.modalDetalleVisible = true;
    this.cdRef.detectChanges();
  }

  cerrarModalDetalle(): void {
    this.modalDetalleVisible = false;
    this.imagenSeleccionada = null;
    this.cdRef.detectChanges();
  }

  eliminarImagen(x: ImagenListadoDto): void {
    if (!this.esAdminUI()) return;

    this.imagenSeleccionada = x;
    this.confirmMensaje = `¿Seguro que deseas eliminar la imagen "${this.obtenerNombre(x)}"?`;
    this.confirmVisible = true;
    this.cdRef.detectChanges();
  }

  cancelarConfirmacion(): void {
    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.imagenSeleccionada = null;
    this.cdRef.detectChanges();
  }

  confirmarEliminacion(): void {
    const x = this.imagenSeleccionada;

    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.imagenSeleccionada = null;
    this.cdRef.detectChanges();

    if (!x) return;

    this.ejecutarEliminarImagen(x);
  }

  private ejecutarEliminarImagen(x: ImagenListadoDto): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.imagenService.eliminar(Number(x.imgId)).pipe(take(1)).subscribe({
      next: () => {
        this.imagenes = this.imagenes.filter(i => Number(i.imgId) !== Number(x.imgId));
        this.ajustarPaginaDespuesDeCambios();
        this.cargando = false;
        this.mensajeOk = 'Imagen eliminada correctamente.';
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.imagenes = this.imagenes.filter(i => Number(i.imgId) !== Number(x.imgId));
          this.ajustarPaginaDespuesDeCambios();
          this.cargando = false;
          this.mensajeOk = 'Imagen eliminada correctamente.';
          this.cdRef.detectChanges();
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al eliminar la imagen.');
        this.cdRef.detectChanges();
      }
    });
  }

  private ajustarPaginaDespuesDeCambios(): void {
    const total = this.totalPaginas;
    if (this.paginaActual > total) this.paginaActual = total;
    if (this.paginaActual < 1) this.paginaActual = 1;
  }

  private extraerMensajeError(err: any, porDefecto: string): string {
    if (!err) return porDefecto;

    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error && typeof err.error === 'object') {
      if (typeof err.error.mensaje === 'string' && err.error.mensaje.trim()) return err.error.mensaje;
      if (typeof err.error.message === 'string' && err.error.message.trim()) return err.error.message;
      if (typeof err.error.title === 'string' && err.error.title.trim()) return err.error.title;
      if (typeof err.error.detail === 'string' && err.error.detail.trim()) return err.error.detail;
    }

    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    return porDefecto;
  }
}