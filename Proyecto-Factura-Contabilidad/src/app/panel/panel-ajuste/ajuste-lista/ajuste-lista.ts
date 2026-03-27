import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';

import {
  ProductoService,
  ProductoListadoDto
} from '../../../servicios/producto.service';

import {
  AjusteStockService
} from '../../../servicios/ajuste-stock.service';

@Component({
  selector: 'app-ajuste-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ajuste-lista.html',
  styleUrls: ['./ajuste-lista.css'],
})
export class AjusteLista implements OnInit {
  private productoService = inject(ProductoService);
  private ajusteStockService = inject(AjusteStockService);
  private cdRef = inject(ChangeDetectorRef);

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  productosRaw: ProductoListadoDto[] = [];
  productosFiltrados: ProductoListadoDto[] = [];
  productosPagina: ProductoListadoDto[] = [];

  termino = '';
  soloActivos = true;

  paginaActual = 1;
  tamanoPagina = 10;
  totalPaginas = 1;

  modalVisible = false;
  modalProducto: ProductoListadoDto | null = null;
  nuevoStock: number | null = null;
  motivoAjuste = '';
  documentoReferencia = '';
  modalError = '';

  ngOnInit(): void {
    this.cargarData();
  }

  cargarData(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.productoService.listar({
      pagina: 1,
      registrosPorPagina: 500
    })
    .pipe(take(1))
    .subscribe({
      next: (response: any) => {
        this.productosRaw = this.extraerLista(response)
          .sort((a, b) => String(a.prodNombre ?? '').localeCompare(String(b.prodNombre ?? '')));

        this.cargando = false;
        this.aplicarFiltros(true);
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        this.productosRaw = [];
        this.productosFiltrados = [];
        this.productosPagina = [];
        this.totalPaginas = 1;
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'No se pudieron cargar los productos.');
        this.cdRef.detectChanges();
      }
    });
  }

  recargar(): void {
    this.cargarData();
  }

  aplicarFiltros(resetPagina = true): void {
    if (resetPagina) {
      this.paginaActual = 1;
    }

    const t = String(this.termino ?? '').trim().toLowerCase();

    let arr = [...this.productosRaw];

    if (this.soloActivos) {
      arr = arr.filter(p => p.prodEstado === true);
    }

    if (t) {
      arr = arr.filter((p) => {
        const id = String(p.prodId ?? '').toLowerCase();
        const nombre = String(p.prodNombre ?? '').toLowerCase();
        const marca = String(p.marcaNombre ?? '').toLowerCase();
        const categoria = String(p.catNombre ?? '').toLowerCase();

        return (
          id.includes(t) ||
          nombre.includes(t) ||
          marca.includes(t) ||
          categoria.includes(t)
        );
      });
    }

    this.productosFiltrados = arr;
    this.totalPaginas = Math.max(1, Math.ceil(this.productosFiltrados.length / this.tamanoPagina));

    if (this.paginaActual > this.totalPaginas) {
      this.paginaActual = this.totalPaginas;
    }

    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    this.productosPagina = this.productosFiltrados.slice(inicio, inicio + this.tamanoPagina);

    this.cdRef.detectChanges();
  }

  limpiar(): void {
    this.termino = '';
    this.soloActivos = true;
    this.paginaActual = 1;
    this.aplicarFiltros(false);
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
      this.aplicarFiltros(false);
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
      this.aplicarFiltros(false);
    }
  }

  abrirModalEditar(prod: ProductoListadoDto): void {
    this.modalProducto = { ...prod };
    this.nuevoStock = Number.isFinite(Number(prod.prodCantidad)) ? Number(prod.prodCantidad) : 0;
    this.motivoAjuste = 'Ajuste manual';
    this.documentoReferencia = '';
    this.modalError = '';
    this.modalVisible = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.modalProducto = null;
    this.nuevoStock = null;
    this.motivoAjuste = '';
    this.documentoReferencia = '';
    this.modalError = '';
    this.cdRef.detectChanges();
  }

  puedeConfirmarModal(): boolean {
    if (!this.modalProducto) return false;

    const n = Number(this.nuevoStock);
    if (!Number.isFinite(n) || n < 0) return false;

    const actual = Number(this.modalProducto.prodCantidad) || 0;
    return Math.floor(n) !== Math.floor(actual);
  }

  confirmarAjuste(): void {
    if (!this.modalProducto) return;

    const prodId = Number(this.modalProducto.prodId);
    const nuevoStock = Math.floor(Number(this.nuevoStock));

    if (!Number.isFinite(prodId) || prodId <= 0) {
      this.modalError = 'Producto inválido.';
      this.cdRef.detectChanges();
      return;
    }

    if (!Number.isFinite(nuevoStock) || nuevoStock < 0) {
      this.modalError = 'Nuevo stock inválido.';
      this.cdRef.detectChanges();
      return;
    }

    const motivo = String(this.motivoAjuste ?? '').trim();
    if (!motivo) {
      this.modalError = 'El motivo del ajuste es obligatorio.';
      this.cdRef.detectChanges();
      return;
    }

    this.cargando = true;
    this.modalError = '';
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.ajusteStockService.ajustar(prodId, {
      nuevoStock,
      motivo,
      documentoReferencia: String(this.documentoReferencia ?? '').trim() || null
    })
    .pipe(take(1))
    .subscribe({
      next: (response) => {
        const data = response?.datos ?? null;

        this.cargando = false;

        this.actualizarStockLocal(prodId, nuevoStock);

        const anterior = data?.stockAnterior;
        const kardexId = data?.kardexId;

        this.mensajeOk =
          kardexId != null
            ? `Ajuste aplicado correctamente. Stock: ${anterior} → ${nuevoStock}. Kardex #${kardexId}.`
            : `Ajuste aplicado correctamente. Stock actualizado a ${nuevoStock}.`;

        this.cerrarModal();
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        this.cargando = false;
        this.modalError = this.extraerMensajeError(err, 'Error al registrar el ajuste.');
        this.cdRef.detectChanges();
      }
    });
  }

  private actualizarStockLocal(prodId: number, nuevoStock: number): void {
    for (const p of this.productosRaw) {
      if (Number(p.prodId) === Number(prodId)) {
        p.prodCantidad = nuevoStock;
        break;
      }
    }

    this.aplicarFiltros(false);
  }

  claseEstado(estado: boolean): string {
    return estado
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  }

  trackByProdId(_: number, item: ProductoListadoDto): number {
    return item.prodId;
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

    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    const errors = err?.error?.errors;
    if (errors && typeof errors === 'object') {
      const lista = Object.entries(errors)
        .flatMap(([campo, msgs]: any) =>
          (Array.isArray(msgs) ? msgs : [msgs]).map((m: any) => `${campo}: ${m}`)
        );

      if (lista.length) return lista.join(' | ');
    }

    if (err.error && typeof err.error === 'object') {
      if (typeof err.error.mensaje === 'string' && err.error.mensaje.trim()) return err.error.mensaje;
      if (typeof err.error.message === 'string' && err.error.message.trim()) return err.error.message;
      if (typeof err.error.title === 'string' && err.error.title.trim()) return err.error.title;
      if (typeof err.error.detail === 'string' && err.error.detail.trim()) return err.error.detail;
    }

    if (typeof err.message === 'string' && err.message.trim()) return err.message;
    return porDefecto;
  }
}