import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';

import {
  FacturaService,
  FacturaDto,
  FacturaDetalleDto
} from '../../../servicios/factura.service';

@Component({
  selector: 'app-detalle-factura',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-factura.html',
  styleUrls: ['./detalle-factura.css']
})
export class DetalleFactura implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private facturaService = inject(FacturaService);
  private cdRef = inject(ChangeDetectorRef);

  facId = 0;

  factura: FacturaDto | null = null;
  items: FacturaDetalleDto[] = [];

  subtotalFactura = 0;
  ivaFactura = 0;
  totalFactura = 0;

  cargando = false;
  mensajeError = '';

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!Number.isFinite(id) || id <= 0) {
      this.mensajeError = 'El identificador de la factura es inválido.';
      this.cdRef.detectChanges();
      return;
    }

    this.facId = id;
    this.cargarDetalle();
  }

  cargarDetalle(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.cdRef.detectChanges();

    this.facturaService.obtenerPorId(this.facId)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const data = response?.datos ?? null;

          if (!data) {
            this.factura = null;
            this.items = [];
            this.subtotalFactura = 0;
            this.ivaFactura = 0;
            this.totalFactura = 0;
            this.mensajeError = 'No se encontró la factura.';
            this.cargando = false;
            this.cdRef.detectChanges();
            return;
          }

          this.factura = data;
          this.items = Array.isArray(data.detalles) ? data.detalles : [];

          this.subtotalFactura = Number(data.facSubtotal ?? 0);
          this.ivaFactura = Number(data.facIvaValor ?? 0);
          this.totalFactura = Number(data.facTotal ?? 0);

          this.cargando = false;
          this.cdRef.detectChanges();
        },
        error: (err: any) => {
          this.factura = null;
          this.items = [];
          this.subtotalFactura = 0;
          this.ivaFactura = 0;
          this.totalFactura = 0;
          this.cargando = false;
          this.mensajeError = this.extraerMensajeError(err, 'Error al cargar el detalle de la factura.');
          this.cdRef.detectChanges();
        }
      });
  }

  textoEstado(valor: boolean | null): 'Pagada' | 'Pendiente' | 'Anulada' {
    if (valor === null || valor === undefined) return 'Anulada';
    if (valor === true) return 'Pagada';
    return 'Pendiente';
  }

  claseEstado(valor: boolean | null): string {
    const estado = this.textoEstado(valor);

    if (estado === 'Pagada') {
      return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }

    if (estado === 'Pendiente') {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    }

    return 'bg-rose-100 text-rose-700 border-rose-200';
  }

  cantidadTotalItems(): number {
    return this.items.reduce((acc, item) => acc + Number(item.cantidad ?? 0), 0);
  }

  volver(): void {
    this.router.navigate(['/panel/factura-lista']);
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

      if (message) {
        return message;
      }
    }

    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    return porDefecto;
  }
}