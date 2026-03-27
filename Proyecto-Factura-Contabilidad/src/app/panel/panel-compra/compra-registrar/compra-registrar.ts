import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, map, switchMap, take, tap } from 'rxjs/operators';

import {
  CompraService,
  CompraCrearDto
} from '../../../servicios/compra.service';

import {
  ProductoService,
  ProductoListadoDto
} from '../../../servicios/producto.service';

import {
  ProveedorService,
  ProveedorListadoDto
} from '../../../servicios/proveedor.service';

interface CompraItemUi {
  prodId: number;
  nombre: string;
  marcaNombre: string | null;
  categoriaNombre: string | null;
  cantidad: number;
  precio: number;
  subtotal: number;
  stockActual: number;
}

@Component({
  selector: 'app-compra-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compra-registrar.html',
  styleUrls: ['./compra-registrar.css'],
})
export class CompraRegistrar implements OnInit, OnDestroy {
  private compraService = inject(CompraService);
  private productoService = inject(ProductoService);
  private proveedorService = inject(ProveedorService);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);

  cargando = false;
  mensajeError = '';

  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: any = null;

  // proveedor
  busquedaProveedor = '';
  proveedoresFiltrados: ProveedorListadoDto[] = [];
  proveedorSeleccionado: ProveedorListadoDto | null = null;
  buscandoProveedor = false;
  private buscadorProveedor$ = new Subject<string>();

  // producto
  busquedaProducto = '';
  productosFiltrados: ProductoListadoDto[] = [];
  productoSeleccionado: ProductoListadoDto | null = null;
  buscandoProducto = false;
  private buscadorProducto$ = new Subject<string>();

  // item actual
  cantidadAgregar = 1;
  precioAgregar = 0;
  fechaCompra = new Date().toISOString().slice(0, 10);

  // carrito
  items: CompraItemUi[] = [];
  totalCompra = 0;

  ngOnInit(): void {
    this.configurarBuscadores();
  }

  ngOnDestroy(): void {
    this.buscadorProveedor$.complete();
    this.buscadorProducto$.complete();

    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  private configurarBuscadores(): void {
    this.buscadorProveedor$
      .pipe(
        map((t) => String(t ?? '').trim()),
        debounceTime(180),
        distinctUntilChanged(),
        tap(() => {
          this.buscandoProveedor = true;
          this.cdRef.detectChanges();
        }),
        switchMap((term) => {
          if (term.length < 1) {
            this.buscandoProveedor = false;
            this.proveedoresFiltrados = [];
            this.cdRef.detectChanges();
            return of([] as ProveedorListadoDto[]);
          }

          return this.proveedorService.listar({
            nombre: term,
            pagina: 1,
            registrosPorPagina: 15
          } as any).pipe(
            take(1),
            map((response: any) => this.extraerLista<ProveedorListadoDto>(response)),
            catchError(() => of([] as ProveedorListadoDto[]))
          );
        }),
        tap(() => {
          this.buscandoProveedor = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe((lista) => {
        this.proveedoresFiltrados = lista ?? [];
        this.cdRef.detectChanges();
      });

    this.buscadorProducto$
      .pipe(
        map((t) => String(t ?? '').trim()),
        debounceTime(180),
        distinctUntilChanged(),
        tap(() => {
          this.buscandoProducto = true;
          this.cdRef.detectChanges();
        }),
        switchMap((term) => {
          if (term.length < 1) {
            this.buscandoProducto = false;
            this.productosFiltrados = [];
            this.cdRef.detectChanges();
            return of([] as ProductoListadoDto[]);
          }

          return this.productoService.listar({
            nombre: term,
            prodEstado: true,
            pagina: 1,
            registrosPorPagina: 20
          }).pipe(
            take(1),
            map((response: any) => this.extraerLista<ProductoListadoDto>(response)),
            catchError(() => of([] as ProductoListadoDto[]))
          );
        }),
        tap(() => {
          this.buscandoProducto = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe((lista) => {
        this.productosFiltrados = lista ?? [];
        this.cdRef.detectChanges();
      });
  }

  onInputProveedor(): void {
    this.mensajeError = '';

    if (this.proveedorSeleccionado) {
      this.proveedorSeleccionado = null;
    }

    this.proveedoresFiltrados = [];
    this.buscadorProveedor$.next(this.busquedaProveedor);
    this.cdRef.detectChanges();
  }

  onInputProducto(): void {
    this.mensajeError = '';

    if (this.productoSeleccionado) {
      this.productoSeleccionado = null;
      this.precioAgregar = 0;
      this.cantidadAgregar = 1;
    }

    this.productosFiltrados = [];
    this.buscadorProducto$.next(this.busquedaProducto);
    this.cdRef.detectChanges();
  }

  seleccionarProveedor(p: ProveedorListadoDto): void {
    this.proveedorSeleccionado = p;
    this.busquedaProveedor = p.provNombre ?? '';
    this.proveedoresFiltrados = [];
    this.cdRef.detectChanges();
  }

  seleccionarProducto(p: ProductoListadoDto): void {
    this.productoSeleccionado = p;
    this.busquedaProducto = p.prodNombre ?? '';
    this.precioAgregar = Number(p.prodPreciocom ?? 0);
    this.cantidadAgregar = 1;
    this.productosFiltrados = [];
    this.cdRef.detectChanges();
  }

  agregarProducto(): void {
    this.mensajeError = '';

    if (!this.productoSeleccionado) {
      this.setError('Seleccione un producto.');
      return;
    }

    const cantidad = Number(this.cantidadAgregar);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      this.setError('La cantidad debe ser mayor a 0.');
      return;
    }

    const precio = Number(this.precioAgregar);
    if (!Number.isFinite(precio) || precio <= 0) {
      this.setError('El precio de compra debe ser mayor a 0.');
      return;
    }

    const prodId = Number(this.productoSeleccionado.prodId);
    const existe = this.items.some((x) => x.prodId === prodId);

    if (existe) {
      this.setError('Ese producto ya fue agregado. Edita cantidad o precio desde la tabla.');
      return;
    }

    this.items.push({
      prodId,
      nombre: this.productoSeleccionado.prodNombre,
      marcaNombre: this.productoSeleccionado.marcaNombre ?? null,
      categoriaNombre: this.productoSeleccionado.catNombre ?? null,
      cantidad: Math.floor(cantidad),
      precio,
      subtotal: Number((Math.floor(cantidad) * precio).toFixed(2)),
      stockActual: Number(this.productoSeleccionado.prodCantidad ?? 0)
    });

    this.calcularTotal();
    this.limpiarItemActual();
    this.cdRef.detectChanges();
  }

  private limpiarItemActual(): void {
    this.productoSeleccionado = null;
    this.busquedaProducto = '';
    this.productosFiltrados = [];
    this.cantidadAgregar = 1;
    this.precioAgregar = 0;
  }

  onCantidadItemChange(item: CompraItemUi): void {
    const cantidad = Number(item.cantidad);
    item.cantidad = Number.isFinite(cantidad) && cantidad > 0 ? Math.floor(cantidad) : 1;
    item.subtotal = Number((item.cantidad * item.precio).toFixed(2));
    this.calcularTotal();
    this.cdRef.detectChanges();
  }

  onPrecioItemChange(item: CompraItemUi): void {
    const precio = Number(item.precio);
    item.precio = Number.isFinite(precio) && precio > 0 ? Number(precio.toFixed(2)) : 0;
    item.subtotal = Number((item.cantidad * item.precio).toFixed(2));
    this.calcularTotal();
    this.cdRef.detectChanges();
  }

  eliminarItem(index: number): void {
    this.items.splice(index, 1);
    this.calcularTotal();
    this.cdRef.detectChanges();
  }

  private calcularTotal(): void {
    this.totalCompra = Number(
      this.items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0).toFixed(2)
    );
  }

  registrarCompra(): void {
    this.mensajeError = '';

    if (!this.proveedorSeleccionado) {
      this.setError('Seleccione un proveedor.');
      return;
    }

    if (this.items.length === 0) {
      this.setError('Agregue al menos un producto.');
      return;
    }

    const dto: CompraCrearDto = {
      provId: this.proveedorSeleccionado.provId,
      compraFecha: (this.fechaCompra ?? '').trim() || null,
      detalles: this.items.map((i) => ({
        prodId: i.prodId,
        cantidad: i.cantidad,
        precio: i.precio
      }))
    };

    this.cargando = true;
    this.cdRef.detectChanges();

    this.compraService.crear(dto)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.cargando = false;
          this.abrirModalOkAuto('Compra registrada correctamente.');
        },
        error: (err: any) => {
          this.cargando = false;
          this.setError(this.extraerMensajeError(err, 'Error al registrar compra.'));
        }
      });
  }

  irACrearProveedor(): void {
    this.router.navigate(['/panel/proveedor-crear']);
  }

  private abrirModalOkAuto(msg: string): void {
    this.modalOkMensaje = msg;
    this.modalOkVisible = true;
    this.cdRef.detectChanges();

    if (this.okTimer) {
      clearTimeout(this.okTimer);
    }

    this.okTimer = setTimeout(() => {
      this.modalOkVisible = false;
      this.modalOkMensaje = '';
      this.cdRef.detectChanges();
      this.router.navigate(['/panel/compra-lista']);
    }, 2000);
  }

  private setError(msg: string): void {
    this.mensajeError = msg;
    this.cdRef.detectChanges();
  }

  private extraerLista<T>(response: any): T[] {
    if (Array.isArray(response?.datos)) return response.datos as T[];
    if (Array.isArray(response?.data)) return response.data as T[];
    if (Array.isArray(response?.items)) return response.items as T[];
    if (Array.isArray(response)) return response as T[];
    return [];
  }

  private extraerMensajeError(err: any, porDefecto: string): string {
    if (!err) return porDefecto;

    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error.trim();
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
        (typeof err.error.mensaje === 'string' && err.error.mensaje) ||
        '';

      if (message) {
        return message;
      }
    }

    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message.trim();
    }

    return porDefecto;
  }
}