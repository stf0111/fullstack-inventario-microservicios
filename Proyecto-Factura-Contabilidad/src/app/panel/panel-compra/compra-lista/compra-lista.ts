import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, take } from 'rxjs/operators';

import {
  CompraService,
  CompraDto,
  CompraFiltroDto
} from '../../../servicios/compra.service';

@Component({
  selector: 'app-compra-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compra-lista.html',
  styleUrls: ['./compra-lista.css'],
})
export class CompraLista implements OnInit, OnDestroy {
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);
  private compraService = inject(CompraService);

  cargando = false;
  mensajeError = '';

  private comprasRaw: CompraDto[] = [];
  comprasFiltrado: CompraDto[] = [];
  comprasPagina: CompraDto[] = [];

  // filtros UI
  busqueda = '';
  fechaDesde = '';
  fechaHasta = '';

  // paginación local
  pageSize = 10;
  pageIndex = 1;
  totalPages = 1;
  pageNumbers: number[] = [];

  private filter$ = new Subject<void>();

  ngOnInit(): void {
    this.cargarCompras();

    this.filter$
      .pipe(debounceTime(300))
      .subscribe(() => {
        this.pageIndex = 1;
        this.cargarCompras();
      });
  }

  ngOnDestroy(): void {
    this.filter$.complete();
  }

  cargarCompras(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.cdRef.detectChanges();

    const filtro: CompraFiltroDto = {
      pagina: 1,
      registrosPorPagina: 500
    };

    if ((this.fechaDesde ?? '').trim()) {
      filtro.fechaInicio = this.fechaDesde.trim();
    }

    if ((this.fechaHasta ?? '').trim()) {
      filtro.fechaFin = this.fechaHasta.trim();
    }

    this.compraService
      .listar(filtro)
      .pipe(take(1))
      .subscribe({
        next: (response: any) => {
          const lista = this.extraerLista(response);

          this.comprasRaw = [...lista].sort((a, b) => {
            const fa = new Date(a.compraFecha).getTime();
            const fb = new Date(b.compraFecha).getTime();

            if (fb !== fa) return fb - fa;
            return (b.compraId ?? 0) - (a.compraId ?? 0);
          });

          this.cargando = false;
          this.aplicarFiltrosYPaginacion(true);
          this.cdRef.detectChanges();
        },
        error: (err: any) => {
          this.cargando = false;
          this.comprasRaw = [];
          this.comprasFiltrado = [];
          this.comprasPagina = [];
          this.totalPages = 1;
          this.pageNumbers = [];
          this.mensajeError = this.extraerMensajeError(err, 'Error al cargar las compras.');
          this.cdRef.detectChanges();
        }
      });
  }

  onFiltrosChange(): void {
    this.filter$.next();
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.pageIndex = 1;
    this.cargarCompras();
  }

  aplicarFiltrosYPaginacion(resetPage: boolean): void {
    if (resetPage) {
      this.pageIndex = 1;
    }

    let arr = [...this.comprasRaw];

    const q = (this.busqueda ?? '').trim().toLowerCase();
    if (q) {
      arr = arr.filter((c) => {
        const proveedor = String(c.provNombre ?? '').toLowerCase();
        const compraId = String(c.compraId ?? '').toLowerCase();
        const total = String(c.total ?? '').toLowerCase();

        return proveedor.includes(q) || compraId.includes(q) || total.includes(q);
      });
    }

    this.comprasFiltrado = arr;
    this.totalPages = Math.max(1, Math.ceil(this.comprasFiltrado.length / this.pageSize));

    if (this.pageIndex > this.totalPages) {
      this.pageIndex = this.totalPages;
    }

    const startIdx = (this.pageIndex - 1) * this.pageSize;
    this.comprasPagina = this.comprasFiltrado.slice(startIdx, startIdx + this.pageSize);

    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);

    this.cdRef.detectChanges();
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages) return;
    this.pageIndex = p;
    this.aplicarFiltrosYPaginacion(false);
  }

  irADetalles(compraId: number): void {
    this.router.navigate(['/panel/detalle-compra', compraId]);
  }

  nuevaCompra(): void {
    this.router.navigate(['/panel/compra-registrar']);
  }

  trackByCompra(_: number, item: CompraDto): number {
    return item.compraId;
  }

  totalItems(c: CompraDto): number {
    return Array.isArray(c.detalles)
      ? c.detalles.reduce((acc, d) => acc + Number(d.cantidad ?? 0), 0)
      : 0;
  }

  private extraerLista(response: any): CompraDto[] {
    if (Array.isArray(response?.datos)) return response.datos as CompraDto[];
    if (Array.isArray(response?.data)) return response.data as CompraDto[];
    if (Array.isArray(response?.items)) return response.items as CompraDto[];
    if (Array.isArray(response)) return response as CompraDto[];
    return [];
  }

  private extraerMensajeError(err: any, porDefecto: string): string {
    if (!err) return porDefecto;

    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error.trim();
    }

    const errors = err?.error?.errors;
    if (errors && typeof errors === 'object') {
      const lista = Object.entries(errors)
        .flatMap(([campo, msgs]: any) =>
          (Array.isArray(msgs) ? msgs : [msgs]).map((m: any) => `${campo}: ${m}`)
        );

      if (lista.length) return lista.join(' | ');
    }

    if (typeof err?.error?.mensaje === 'string' && err.error.mensaje.trim()) {
      return err.error.mensaje.trim();
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
}