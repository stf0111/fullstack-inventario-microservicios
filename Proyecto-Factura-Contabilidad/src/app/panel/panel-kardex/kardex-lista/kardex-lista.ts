import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';

import { KardexService, KardexDto, KardexFiltroDto } from '../../../servicios/kardex.service';

@Component({
  selector: 'app-kardex-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kardex-lista.html',
  styleUrls: ['./kardex-lista.css']
})
export class KardexLista implements OnInit {
  private kardexService = inject(KardexService);
  private cdRef = inject(ChangeDetectorRef);

  cargando = false;
  mensajeError = '';

  kardexPagina: KardexDto[] = [];

  modalDetalleVisible = false;
  detalle: KardexDto | null = null;

  filtroProdId: number | null = null;
  filtroUsuId: number | null = null;
  filtroTipo = '';
  filtroDesde = '';
  filtroHasta = '';

  pageSizeOptions = [10, 20, 50];
  pageSize = 10;
  pageIndex = 1;
  totalPages = 1;
  totalRegistros = 0;
  rangoDesde = 0;
  rangoHasta = 0;

  ngOnInit(): void {
    this.cargarKardex();
  }

  onFiltrosChange(): void {
    this.pageIndex = 1;
    this.cargarKardex();
  }

  onPageSizeChange(): void {
    this.pageIndex = 1;
    this.cargarKardex();
  }

  prevPage(): void {
    if (this.pageIndex <= 1) return;
    this.pageIndex--;
    this.cargarKardex();
  }

  nextPage(): void {
    if (this.pageIndex >= this.totalPages) return;
    this.pageIndex++;
    this.cargarKardex();
  }

  limpiarFiltros(): void {
    this.filtroProdId = null;
    this.filtroUsuId = null;
    this.filtroTipo = '';
    this.filtroDesde = '';
    this.filtroHasta = '';
    this.pageIndex = 1;
    this.cargarKardex();
  }

  abrirDetalle(k: KardexDto): void {
    this.cargando = true;
    this.mensajeError = '';
    this.cdRef.detectChanges();

    this.kardexService.obtenerPorId(k.kdxId)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          this.detalle = this.extraerDetalle(response) ?? k;
          this.modalDetalleVisible = true;
          this.cargando = false;
          this.cdRef.detectChanges();
        },
        error: (err: any) => {
          this.detalle = k;
          this.modalDetalleVisible = true;
          this.cargando = false;
          this.mensajeError = this.extraerMensajeError(err, 'No se pudo cargar el detalle del movimiento.');
          this.cdRef.detectChanges();
        }
      });
  }

  cerrarDetalle(): void {
    this.modalDetalleVisible = false;
    this.detalle = null;
    this.cdRef.detectChanges();
  }

  trackByKdxId(_: number, item: KardexDto): number {
    return item.kdxId;
  }

  claseTipo(tipo: string): string {
    const t = (tipo ?? '').trim().toLowerCase();

    if (t.includes('entrada')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (t.includes('salida')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (t.includes('ajuste')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }

    return 'bg-slate-50 text-slate-700 border-slate-200';
  }

  claseMotivo(motivo?: string | null): string {
    const m = (motivo ?? '').trim().toLowerCase();

    if (!m) {
      return 'bg-slate-50 text-slate-700 border-slate-200';
    }

    if (m.includes('venta') || m.includes('factura') || m.includes('salida')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }

    if (m.includes('compra') || m.includes('ingreso') || m.includes('entrada')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    if (m.includes('ajuste') || m.includes('inventario') || m.includes('corrección') || m.includes('correccion')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }

    return 'bg-slate-50 text-slate-700 border-slate-200';
  }

  private cargarKardex(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.cdRef.detectChanges();

    const filtro: KardexFiltroDto = {
      pagina: this.pageIndex,
      registrosPorPagina: this.pageSize
    };

    const prodId = Number(this.filtroProdId);
    if (Number.isFinite(prodId) && prodId > 0) {
      filtro.prodId = prodId;
    }

    const usuId = Number(this.filtroUsuId);
    if (Number.isFinite(usuId) && usuId > 0) {
      filtro.usuId = usuId;
    }

    if ((this.filtroTipo ?? '').trim()) {
      filtro.kdxTipo = this.filtroTipo.trim();
    }

    if ((this.filtroDesde ?? '').trim()) {
      filtro.fechaInicio = this.filtroDesde.trim();
    }

    if ((this.filtroHasta ?? '').trim()) {
      filtro.fechaFin = this.filtroHasta.trim();
    }

    this.kardexService.listar(filtro)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          const lista = this.extraerLista(response).sort((a, b) => {
            const idA = Number(a.kdxId) || 0;
            const idB = Number(b.kdxId) || 0;

            if (idB !== idA) return idB - idA;

            const fechaA = new Date(a.kdxFecha).getTime();
            const fechaB = new Date(b.kdxFecha).getTime();
            return fechaB - fechaA;
          });

          this.kardexPagina = lista;

          this.totalRegistros = this.extraerTotalRegistros(response, lista.length);
          this.totalPages = this.extraerTotalPages(response, this.totalRegistros, this.pageSize);

          if (this.totalRegistros === 0) {
            this.rangoDesde = 0;
            this.rangoHasta = 0;
          } else {
            this.rangoDesde = ((this.pageIndex - 1) * this.pageSize) + 1;
            this.rangoHasta = Math.min(this.pageIndex * this.pageSize, this.totalRegistros);
          }

          this.cargando = false;
          this.cdRef.detectChanges();
        },
        error: (err: any) => {
          this.kardexPagina = [];
          this.totalRegistros = 0;
          this.totalPages = 1;
          this.rangoDesde = 0;
          this.rangoHasta = 0;
          this.cargando = false;
          this.mensajeError = this.extraerMensajeError(err, 'Error al cargar Kardex.');
          this.cdRef.detectChanges();
        }
      });
  }

  private extraerLista(response: any): KardexDto[] {
    if (Array.isArray(response?.datos)) return response.datos;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response)) return response;
    return [];
  }

  private extraerDetalle(response: any): KardexDto | null {
    if (response?.datos) return response.datos as KardexDto;
    if (response?.data) return response.data as KardexDto;
    if (response && typeof response === 'object' && 'kdxId' in response) return response as KardexDto;
    return null;
  }

  private extraerTotalRegistros(response: any, fallback: number): number {
    const total =
      Number(response?.totalRegistros) ||
      Number(response?.total) ||
      Number(response?.totalItems) ||
      Number(response?.registrosTotales) ||
      fallback;

    return total > 0 ? total : fallback;
  }

  private extraerTotalPages(response: any, totalRegistros: number, pageSize: number): number {
    const totalPaginas =
      Number(response?.totalPaginas) ||
      Number(response?.pages) ||
      Number(response?.totalPages);

    if (Number.isFinite(totalPaginas) && totalPaginas > 0) {
      return totalPaginas;
    }

    return Math.max(1, Math.ceil(totalRegistros / pageSize));
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

      if (lista.length) {
        return lista.join(' | ');
      }
    }

    if (err.error && typeof err.error === 'object') {
      const message =
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