import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import {
  ProductoService,
  ProductoListadoDto
} from '../../../servicios/producto.service';

@Component({
  selector: 'app-reporte-stock-producto-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-stock-producto-lista.html',
  styleUrls: ['./reporte-stock-producto-lista.css'],
})
export class ReporteStockProductoLista implements OnInit {
  private authService = inject(AuthService);
  private productoService = inject(ProductoService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  // Sesión
  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario = '';

  // Data
  reportes: ProductoListadoDto[] = [];

  // UI
  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  // Filtros
  terminoBusqueda = '';
  filtroTipoNombre = '';   // aquí realmente será categoría
  filtroMarcaNombre = '';
  soloActivos = false;

  // Paginación
  paginaActual = 1;
  tamanoPagina = 12;

  // Modal
  modalDetalleVisible = false;
  itemSeleccionado: ProductoListadoDto | null = null;

  ngOnInit(): void {
    this.cargarSesionYDatos();
  }

  private cargarSesionYDatos(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.authService.me()
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.usuarioActual = response?.datos ?? null;

          if (!this.usuarioActual) {
            this.cargando = false;
            this.router.navigate(['/login']);
            return;
          }

          this.rolUsuario = this.usuarioActual.usuRol ?? 'Usuario';
          this.cargarDatos();
        },
        error: () => {
          this.cargando = false;
          this.router.navigate(['/login']);
        },
      });
  }

  cargarDatos(mantenerMensajes = false): void {
    this.cargando = true;

    if (!mantenerMensajes) {
      this.mensajeError = '';
      this.mensajeOk = '';
    }

    this.cdRef.detectChanges();

    this.productoService.listar({
      pagina: 1,
      registrosPorPagina: 500
    })
    .pipe(take(1))
    .subscribe({
      next: (response: any) => {
        this.reportes = this.extraerLista(response);
        this.paginaActual = 1;
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.reportes = [];
        this.paginaActual = 1;
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(
          err,
          'No se pudo cargar el reporte de stock por producto.'
        );
        this.cdRef.detectChanges();
      },
    });
  }

  get reportesFiltrados(): ProductoListadoDto[] {
    let lista = [...this.reportes];

    const t = this.terminoBusqueda.trim().toLowerCase();
    if (t) {
      lista = lista.filter((x) => {
        const producto = (x.prodNombre ?? '').toLowerCase();
        const marca = (x.marcaNombre ?? '').toLowerCase();
        const categoria = (x.catNombre ?? '').toLowerCase();
        const id = String(x.prodId ?? '').toLowerCase();

        return (
          producto.includes(t) ||
          marca.includes(t) ||
          categoria.includes(t) ||
          id.includes(t)
        );
      });
    }

    if (this.filtroTipoNombre.trim()) {
      const categoria = this.filtroTipoNombre.trim().toLowerCase();
      lista = lista.filter((x) => (x.catNombre ?? '').toLowerCase() === categoria);
    }

    if (this.filtroMarcaNombre.trim()) {
      const marca = this.filtroMarcaNombre.trim().toLowerCase();
      lista = lista.filter((x) => (x.marcaNombre ?? '').toLowerCase() === marca);
    }

    if (this.soloActivos) {
      lista = lista.filter((x) => x.prodEstado === true);
    }

    return lista.sort((a, b) => {
      const ca = (a.catNombre ?? '').toLowerCase();
      const cb = (b.catNombre ?? '').toLowerCase();
      if (ca !== cb) return ca.localeCompare(cb);

      const ma = (a.marcaNombre ?? '').toLowerCase();
      const mb = (b.marcaNombre ?? '').toLowerCase();
      if (ma !== mb) return ma.localeCompare(mb);

      return (a.prodNombre ?? '').localeCompare(b.prodNombre ?? '');
    });
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.reportesFiltrados.length / this.tamanoPagina));
  }

  get reportesPaginaActual(): ProductoListadoDto[] {
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return this.reportesFiltrados.slice(inicio, inicio + this.tamanoPagina);
  }

  get totalRegistros(): number {
    return this.reportes.length;
  }

  get totalUnidades(): number {
    return this.reportesFiltrados.reduce((acc, x) => acc + this.toNumber(x.prodCantidad), 0);
  }

  get totalTipos(): number {
    return new Set(
      this.reportes.map((x) => (x.catNombre ?? '').trim()).filter(Boolean)
    ).size;
  }

  get totalMarcas(): number {
    return new Set(
      this.reportes.map((x) => (x.marcaNombre ?? '').trim()).filter(Boolean)
    ).size;
  }

  get tiposDisponibles(): string[] {
    return [...new Set(
      this.reportes
        .map((x) => (x.catNombre ?? '').trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }

  get marcasDisponibles(): string[] {
    return [...new Set(
      this.reportes
        .map((x) => (x.marcaNombre ?? '').trim())
        .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));
  }

  buscar(): void {
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroTipoNombre = '';
    this.filtroMarcaNombre = '';
    this.soloActivos = false;
    this.paginaActual = 1;
    this.mensajeError = '';
    this.mensajeOk = '';
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  verDetalle(item: ProductoListadoDto): void {
    this.itemSeleccionado = item;
    this.modalDetalleVisible = true;
    this.cdRef.detectChanges();
  }

  cerrarModalDetalle(): void {
    this.itemSeleccionado = null;
    this.modalDetalleVisible = false;
    this.cdRef.detectChanges();
  }

  obtenerTextoStock(item: ProductoListadoDto): string {
    const stock = this.toNumber(item.prodCantidad);
    if (stock <= 0) return 'Sin stock';
    if (stock <= 10) return 'Bajo';
    return 'Disponible';
  }

  obtenerClaseStock(item: ProductoListadoDto): string {
    const stock = this.toNumber(item.prodCantidad);

    if (stock <= 0) {
      return 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-rose-50 text-rose-600';
    }

    if (stock <= 10) {
      return 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-600';
    }

    return 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-600';
  }

  obtenerTextoEstadoProducto(item: ProductoListadoDto): string {
    return item.prodEstado ? 'Activo' : 'Inactivo';
  }

  obtenerClaseEstadoProducto(item: ProductoListadoDto): string {
    return item.prodEstado
      ? 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600'
      : 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-600';
  }

  private toNumber(valor: number | null | undefined): number {
    return Number(valor ?? 0) || 0;
  }

  private extraerLista(response: any): ProductoListadoDto[] {
    if (Array.isArray(response?.datos)) return response.datos as ProductoListadoDto[];
    if (Array.isArray(response?.data)) return response.data as ProductoListadoDto[];
    if (Array.isArray(response?.items)) return response.items as ProductoListadoDto[];
    if (Array.isArray(response)) return response as ProductoListadoDto[];
    return [];
  }

  private extraerMensajeError(err: any, porDefecto: string): string {
    if (!err) return porDefecto;

    if (typeof err.error === 'string' && err.error.trim()) return err.error;

    const errors = err?.error?.errors;
    if (errors && typeof errors === 'object') {
      const lista = Object.entries(errors)
        .flatMap(([campo, msgs]: any) =>
          (Array.isArray(msgs) ? msgs : [msgs]).map((m: any) => `${campo}: ${m}`)
        );

      if (lista.length) return lista.join(' | ');
    }

    if (err.error && typeof err.error === 'object') {
      if (typeof err.error.message === 'string') return err.error.message;
      if (typeof err.error.title === 'string') return err.error.title;
      if (typeof err.error.detail === 'string') return err.error.detail;
      if (typeof err.error.mensaje === 'string') return err.error.mensaje;
    }

    if (typeof err.message === 'string' && err.message.trim()) return err.message;
    return porDefecto;
  }
}