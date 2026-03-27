import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, take } from 'rxjs/operators';

import {
  FacturaService,
  FacturaDto,
  FacturaFiltroDto
} from '../../../servicios/factura.service';

@Component({
  selector: 'app-factura-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './factura-lista.html',
  styleUrls: ['./factura-lista.css'],
})
export class FacturaLista implements OnInit, OnDestroy {
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);
  private facturaService = inject(FacturaService);

  cargando = false;
  mensajeError = '';

  modalAnularVisible = false;
  facturaSeleccionadaAnular: FacturaDto | null = null;
  anulandoFactura = false;

  private facturasRaw: FacturaDto[] = [];
  facturasFiltrado: FacturaDto[] = [];
  facturasPagina: FacturaDto[] = [];

  busqueda = '';
  filtroEstado: '' | 'Pagada' | 'Pendiente' | 'Anulada' = '';

  fechaDesde = '';
  fechaHasta = '';

  pageSize = 10;
  pageIndex = 1;
  totalPages = 1;
  pageNumbers: number[] = [];

  private filter$ = new Subject<void>();

  ngOnInit(): void {
    this.cargarFacturas();

    this.filter$
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.pageIndex = 1;
        this.cargarFacturas();
      });
  }

  ngOnDestroy(): void {
    this.filter$.complete();
  }

  cargarFacturas(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.cdRef.detectChanges();

    const filtro: FacturaFiltroDto = {
      pagina: 1,
      registrosPorPagina: 500
    };

    if ((this.fechaDesde ?? '').trim()) {
      filtro.fechaInicio = this.fechaDesde.trim();
    }

    if ((this.fechaHasta ?? '').trim()) {
      filtro.fechaFin = this.fechaHasta.trim();
    }

    if (this.filtroEstado === 'Pagada') {
      filtro.facEstado = true;
    } else if (this.filtroEstado === 'Pendiente') {
      filtro.facEstado = false;
    }
    // Para Anulada no mando facEstado porque el DTO actual no permite filtrar null desde query

    this.facturaService
      .listar(filtro)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          const lista = this.extraerLista(response);

          this.facturasRaw = [...lista].sort((a, b) => {
            const fa = new Date(a.facFecha).getTime();
            const fb = new Date(b.facFecha).getTime();

            if (fb !== fa) return fb - fa;
            return (b.facId ?? 0) - (a.facId ?? 0);
          });

          this.cargando = false;
          this.aplicarFiltrosYPaginacion(true);
          this.cdRef.detectChanges();
        },
        error: (err: any) => {
          this.cargando = false;
          this.facturasRaw = [];
          this.facturasFiltrado = [];
          this.facturasPagina = [];
          this.totalPages = 1;
          this.pageNumbers = [];
          this.mensajeError = this.extraerMensajeError(err, 'Error al cargar las facturas.');
          this.cdRef.detectChanges();
        }
      });
  }

  onFiltrosChange(): void {
    this.filter$.next();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroEstado = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.pageIndex = 1;
    this.cargarFacturas();
  }

  aplicarFiltrosYPaginacion(resetPage: boolean): void {
    if (resetPage) {
      this.pageIndex = 1;
    }

    let arr = [...this.facturasRaw];

    const q = (this.busqueda ?? '').trim().toLowerCase();
    if (q) {
      arr = arr.filter((f) => {
        const numero = String(f.facNumeroSerie ?? '').toLowerCase();
        const cliente = String(f.cliNombreCompleto ?? '').toLowerCase();
        const tipoPago = String(f.tpaNombre ?? '').toLowerCase();

        return numero.includes(q) || cliente.includes(q) || tipoPago.includes(q);
      });
    }

    const est = (this.filtroEstado ?? '').trim().toLowerCase();
    if (est) {
      arr = arr.filter((f) => this.textoEstado(f.facEstado).toLowerCase() === est);
    }

    this.facturasFiltrado = arr;
    this.totalPages = Math.max(1, Math.ceil(this.facturasFiltrado.length / this.pageSize));

    if (this.pageIndex > this.totalPages) {
      this.pageIndex = this.totalPages;
    }

    const startIdx = (this.pageIndex - 1) * this.pageSize;
    this.facturasPagina = this.facturasFiltrado.slice(startIdx, startIdx + this.pageSize);

    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    this.cdRef.detectChanges();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.pageIndex = p;
    this.aplicarFiltrosYPaginacion(false);
  }

  claseEstado(valor: boolean | null): string {
    const t = this.textoEstado(valor);

    if (t === 'Pagada') {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }

    if (t === 'Pendiente') {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }

    return 'bg-rose-100 text-rose-700 border-rose-200';
  }

  textoEstado(valor: boolean | null): 'Pagada' | 'Pendiente' | 'Anulada' {
    if (valor === null || valor === undefined) return 'Anulada';
    if (valor === true) return 'Pagada';
    return 'Pendiente';
  }

  irADetalles(id: number): void {
    this.router.navigate(['/panel/detalle-factura', id]);
  }

  nuevaFactura(): void {
    this.router.navigate(['/panel/factura-registrar']);
  }

  trackByFactura(_: number, item: FacturaDto): number {
    return item.facId;
  }

  private extraerLista(response: any): FacturaDto[] {
    if (Array.isArray(response?.datos)) return response.datos as FacturaDto[];
    if (Array.isArray(response?.data)) return response.data as FacturaDto[];
    if (Array.isArray(response?.items)) return response.items as FacturaDto[];
    if (Array.isArray(response)) return response as FacturaDto[];
    return [];
  }

  private extraerMensajeError(err: any, porDefecto: string): string {
    const m = err?.error?.mensaje;
    if (typeof m === 'string' && m.trim()) return m.trim();

    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error.trim();
    }

    const errors = err?.error?.errors;
    if (errors && typeof errors === 'object') {
      const lista = Object.entries(errors)
        .flatMap(([campo, msgs]: any) =>
          (Array.isArray(msgs) ? msgs : [msgs]).map((m2: any) => `${campo}: ${m2}`)
        );

      if (lista.length) return lista.join(' | ');
    }

    if (typeof err?.error?.message === 'string' && err.error.message.trim()) {
      return err.error.message.trim();
    }

    if (typeof err?.error?.title === 'string' && err.error.title.trim()) {
      return err.error.title.trim();
    }

    if (typeof err?.message === 'string' && err.message.trim()) {
      return err.message.trim();
    }

    return porDefecto;
  }


  anularFactura(factura: FacturaDto): void {
    if (!factura?.facId) return;

    this.facturaSeleccionadaAnular = factura;
    this.modalAnularVisible = true;
    this.cdRef.detectChanges();
  }

  confirmarAnularFactura(): void {
    if (!this.facturaSeleccionadaAnular?.facId || this.anulandoFactura) return;

    this.anulandoFactura = true;
    this.mensajeError = '';
    this.cdRef.detectChanges();

    this.facturaService
      .anular(this.facturaSeleccionadaAnular.facId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.anulandoFactura = false;
          this.modalAnularVisible = false;
          this.facturaSeleccionadaAnular = null;
          this.cdRef.detectChanges();
          this.cargarFacturas();
        },
        error: (err: any) => {
          this.anulandoFactura = false;
          this.mensajeError = this.extraerMensajeError(err, 'Error al anular la factura.');
          this.cdRef.detectChanges();
        }
      });
  }

  cerrarModalAnular(): void {
    if (this.anulandoFactura) return;

    this.modalAnularVisible = false;
    this.facturaSeleccionadaAnular = null;
    this.cdRef.detectChanges();
  }


}