import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';

import {
  CompraService,
  CompraDto,
  CompraDetalleDto
} from '../../../servicios/compra.service';

@Component({
  selector: 'app-detalle-compra',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-compra.html',
  styleUrls: ['./detalle-compra.css'],
})
export class DetalleCompra implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private compraService = inject(CompraService);
  private cdRef = inject(ChangeDetectorRef);

  compraId = 0;
  compra: CompraDto | null = null;
  items: CompraDetalleDto[] = [];

  cargando = false;
  mensajeError = '';
  totalCompra = 0;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!Number.isFinite(id) || id <= 0) {
      this.mensajeError = 'ID de compra inválido.';
      this.cdRef.detectChanges();
      return;
    }

    this.compraId = id;
    this.cargarDetalles();
  }

  cargarDetalles(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.cdRef.detectChanges();

    this.compraService.obtenerPorId(this.compraId)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          const data = response?.datos ?? null;

          if (!data) {
            this.compra = null;
            this.items = [];
            this.totalCompra = 0;
            this.mensajeError = 'No se encontró la compra solicitada.';
            this.cargando = false;
            this.cdRef.detectChanges();
            return;
          }

          this.compra = data;
          this.items = Array.isArray(data.detalles) ? data.detalles : [];
          this.calcularTotal();

          this.cargando = false;
          this.cdRef.detectChanges();
        },
        error: (err: any) => {
          this.compra = null;
          this.items = [];
          this.totalCompra = 0;
          this.cargando = false;
          this.mensajeError = this.extraerMensajeError(err, 'Error al cargar detalle de compra.');
          this.cdRef.detectChanges();
        }
      });
  }

  calcularTotal(): void {
    this.totalCompra = Number(
      this.items.reduce((acc, item) => acc + Number(item.subtotal ?? 0), 0).toFixed(2)
    );
  }

  volver(): void {
    this.router.navigate(['/panel/compra-lista']);
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