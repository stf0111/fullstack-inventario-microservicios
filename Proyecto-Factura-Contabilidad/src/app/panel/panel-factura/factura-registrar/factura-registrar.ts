import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap, take, tap } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ClienteService, ClienteListadoDto } from '../../../servicios/cliente.service';
import { ProductoService, ProductoListadoDto } from '../../../servicios/producto.service';
import { TipoPagoService, TipoPagoListadoDto } from '../../../servicios/tipo-pago.service';
import { ConfiguracionService } from '../../../servicios/configuracion.service';
import { FacturaService, FacturaCrearDto } from '../../../servicios/factura.service';

interface ResultadoBusquedaProducto {
  prodId: number;
  nombre: string;
  precio: number;
  marcaNombre: string;
  categoriaNombre: string;
  stock: number;
  producto: ProductoListadoDto;
}

interface ItemFacturaUi {
  prodId: number;
  nombre: string;
  marcaNombre: string;
  categoriaNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  stockDisponible: number;
}

@Component({
  selector: 'app-factura-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './factura-registrar.html',
  styleUrls: ['./factura-registrar.css']
})
export class FacturaRegistrar implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private productoService = inject(ProductoService);
  private tipoPagoService = inject(TipoPagoService);
  private configuracionService = inject(ConfiguracionService);
  private facturaService = inject(FacturaService);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);

  usuarioActual: UsuarioAutenticadoDto | null = null;

  cargando = false;

  modalOkVisible = false;
  modalOkMensaje = '';
  modalErrorVisible = false;
  modalErrorMensaje = '';

  private okTimer: any = null;
  private errTimer: any = null;

  // cliente
  busquedaCliente = '';
  clientesFiltrados: ClienteListadoDto[] = [];
  clienteSeleccionado: ClienteListadoDto | null = null;
  buscandoCliente = false;
  errorCliente = false;
  private buscadorCliente$ = new Subject<string>();

  // pago
  tiposPago: TipoPagoListadoDto[] = [];
  tipoPagoId: number | null = null;

  // configuración
  ivaPorcentaje = 0;

  // productos
  busquedaProducto = '';
  resultadosProducto: ResultadoBusquedaProducto[] = [];
  productoSeleccionado: ResultadoBusquedaProducto | null = null;
  buscandoProducto = false;
  errorProducto = false;
  private buscadorProducto$ = new Subject<string>();

  cantidadAgregar = 1;

  // detalle factura
  items: ItemFacturaUi[] = [];

  subtotalFactura = 0;
  ivaFactura = 0;
  totalFactura = 0;

  ngOnInit(): void {
    this.cargarSesionYData();
  }

  ngOnDestroy(): void {
    this.buscadorCliente$.complete();
    this.buscadorProducto$.complete();

    if (this.okTimer) clearTimeout(this.okTimer);
    if (this.errTimer) clearTimeout(this.errTimer);
  }

  private cargarSesionYData(): void {
    this.cargando = true;
    this.cdRef.detectChanges();

    this.authService.me().pipe(take(1)).subscribe({
      next: (response) => {
        this.usuarioActual = response?.datos ?? null;

        if (!this.usuarioActual) {
          this.cargando = false;
          this.router.navigate(['/login']);
          return;
        }

        this.cargarDataInicial();
      },
      error: () => {
        this.cargando = false;
        this.router.navigate(['/login']);
      }
    });
  }

  private cargarDataInicial(): void {
    this.configurarBuscadores();

    this.tipoPagoService.listar({ pagina: 1, registrosPorPagina: 50 })
      .pipe(take(1), catchError(() => of(null)))
      .subscribe((response: any) => {
        this.tiposPago = this.extraerLista<TipoPagoListadoDto>(response);

        if (this.tipoPagoId == null && this.tiposPago.length > 0) {
          this.tipoPagoId = this.tiposPago[0].tpaId;
        }

        this.cdRef.detectChanges();
      });

    this.configuracionService.obtener()
      .pipe(take(1), catchError(() => of(null)))
      .subscribe((response: any) => {
        const conf = response?.datos ?? null;
        const iva = Number(conf?.ivaPorcentaje ?? 0);
        this.ivaPorcentaje = Number.isFinite(iva) ? iva : 0;
        this.calcularTotal();
        this.cdRef.detectChanges();
      });

    const st: any = history.state;
    const clienteCreado = st?.clienteCreado as ClienteListadoDto | undefined;

    if (clienteCreado) {
      this.seleccionarCliente(clienteCreado);
    }

    this.cargando = false;
    this.cdRef.detectChanges();
  }

  private configurarBuscadores(): void {
    this.buscadorCliente$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        tap(() => {
          this.buscandoCliente = true;
          this.errorCliente = false;
        }),
        switchMap((termRaw) => {
          const term = String(termRaw ?? '').trim();

          if (term.length < 2) {
            this.buscandoCliente = false;
            return of([] as ClienteListadoDto[]);
          }

          const filtro = /^\d+$/.test(term)
            ? { cedula: term, pagina: 1, registrosPorPagina: 15 }
            : { nombre: term, pagina: 1, registrosPorPagina: 15 };

          return this.clienteService.listar(filtro).pipe(
            take(1),
            tap(() => {
              this.errorCliente = false;
            }),
            catchError(() => {
              this.errorCliente = true;
              return of(null);
            })
          );
        }),
        tap(() => {
          this.buscandoCliente = false;
        })
      )
      .subscribe((response: any) => {
        this.clientesFiltrados = this.extraerLista<ClienteListadoDto>(response);
        this.cdRef.detectChanges();
      });

    this.buscadorProducto$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        tap(() => {
          this.buscandoProducto = true;
          this.errorProducto = false;
        }),
        switchMap((termRaw) => {
          const term = String(termRaw ?? '').trim();

          if (term.length < 2) {
            this.buscandoProducto = false;
            return of([] as ResultadoBusquedaProducto[]);
          }

          return this.productoService.listar({
            nombre: term,
            prodEstado: true,
            pagina: 1,
            registrosPorPagina: 20
          }).pipe(
            take(1),
            catchError(() => {
              this.errorProducto = true;
              return of(null);
            })
          );
        }),
        tap(() => {
          this.buscandoProducto = false;
        })
      )
      .subscribe((response: any) => {
        const productos = this.extraerLista<ProductoListadoDto>(response);

        this.resultadosProducto = productos
          .filter(p => !!p.prodEstado)
          .map((p) => ({
            prodId: p.prodId,
            nombre: p.prodNombre,
            precio: Number(p.prodPrecioven ?? 0),
            marcaNombre: p.marcaNombre ?? '',
            categoriaNombre: p.catNombre ?? '',
            stock: Number(p.prodCantidad ?? 0),
            producto: p
          }));

        this.cdRef.detectChanges();
      });
  }

  onInputCliente(): void {
    if (this.clienteSeleccionado) {
      this.clienteSeleccionado = null;
    }

    this.clientesFiltrados = [];
    this.buscadorCliente$.next(this.busquedaCliente);
    this.cdRef.detectChanges();
  }

  seleccionarCliente(c: ClienteListadoDto): void {
    this.clienteSeleccionado = c;
    this.busquedaCliente = c.cliNombreCompleto || `${c.cliNombre} ${c.cliApellido}`;
    this.clientesFiltrados = [];
    this.cdRef.detectChanges();
  }

  setConsumidorFinal(): void {
    const ced = '9999999999';

    this.clienteSeleccionado = null;
    this.busquedaCliente = ced;
    this.clientesFiltrados = [];
    this.errorCliente = false;
    this.buscandoCliente = true;
    this.cdRef.detectChanges();

    this.clienteService.listar({
      cedula: ced,
      pagina: 1,
      registrosPorPagina: 5
    })
    .pipe(take(1), catchError(() => of(null)))
    .subscribe((response: any) => {
      this.buscandoCliente = false;

      const lista = this.extraerLista<ClienteListadoDto>(response);

      if (lista.length > 0) {
        this.seleccionarCliente(lista[0]);
        return;
      }

      this.abrirModalErrorAuto('No existe "Consumidor Final" (9999999999) en la base de datos.');
      this.cdRef.detectChanges();
    });
  }

  irARegistrarCliente(): void {
    this.router.navigate(['/panel/cliente-factura-crear']);
  }

  onInputProducto(): void {
    if (this.productoSeleccionado) {
      this.productoSeleccionado = null;
    }

    this.resultadosProducto = [];
    this.buscadorProducto$.next(this.busquedaProducto);
    this.cdRef.detectChanges();
  }

  seleccionarProducto(p: ResultadoBusquedaProducto): void {
    this.productoSeleccionado = p;
    this.busquedaProducto = p.nombre;
    this.resultadosProducto = [];
    this.cantidadAgregar = 1;
    this.cdRef.detectChanges();
  }

  agregarProducto(): void {
    if (!this.productoSeleccionado) {
      this.abrirModalErrorAuto('Selecciona un producto.');
      return;
    }

    const cantidad = Number(this.cantidadAgregar);
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      this.abrirModalErrorAuto('La cantidad debe ser mayor a 0.');
      return;
    }

    const producto = this.productoSeleccionado.producto;
    const existente = this.items.find(x => x.prodId === producto.prodId);
    const cantidadActual = existente?.cantidad ?? 0;
    const cantidadFinal = cantidadActual + Math.floor(cantidad);

    const stock = Number(producto.prodCantidad ?? 0);
    if (cantidadFinal > stock) {
      this.abrirModalErrorAuto(`Stock insuficiente. Disponible: ${stock}.`);
      return;
    }

    if (existente) {
      existente.cantidad = cantidadFinal;
      existente.subtotal = Number((existente.cantidad * existente.precioUnitario).toFixed(2));
    } else {
      const precio = Number(producto.prodPrecioven ?? 0);

      this.items.push({
        prodId: producto.prodId,
        nombre: producto.prodNombre,
        marcaNombre: producto.marcaNombre ?? '',
        categoriaNombre: producto.catNombre ?? '',
        cantidad: Math.floor(cantidad),
        precioUnitario: precio,
        subtotal: Number((Math.floor(cantidad) * precio).toFixed(2)),
        stockDisponible: stock
      });
    }

    this.calcularTotal();
    this.limpiarBuscadorProducto();
  }

  limpiarBuscadorProducto(): void {
    this.busquedaProducto = '';
    this.resultadosProducto = [];
    this.productoSeleccionado = null;
    this.cantidadAgregar = 1;
    this.cdRef.detectChanges();
  }

  eliminarItem(index: number): void {
    this.items.splice(index, 1);
    this.calcularTotal();
    this.cdRef.detectChanges();
  }

  onCantidadItemChange(item: ItemFacturaUi): void {
    const cantidad = Number(item.cantidad);

    item.cantidad = Number.isFinite(cantidad) && cantidad > 0 ? Math.floor(cantidad) : 1;

    if (item.cantidad > item.stockDisponible) {
      item.cantidad = item.stockDisponible;
      this.abrirModalErrorAuto(`La cantidad máxima para ${item.nombre} es ${item.stockDisponible}.`);
    }

    item.subtotal = Number((item.cantidad * item.precioUnitario).toFixed(2));
    this.calcularTotal();
    this.cdRef.detectChanges();
  }

  calcularTotal(): void {
    const ivaP = Number(this.ivaPorcentaje ?? 0);
    const factor = 1 + (ivaP / 100);

    const total = this.items.reduce((acc, item) => acc + (Number(item.subtotal) || 0), 0);

    this.totalFactura = Number(total.toFixed(2));
    this.subtotalFactura = Number((ivaP > 0 ? total / factor : total).toFixed(2));
    this.ivaFactura = Number((this.totalFactura - this.subtotalFactura).toFixed(2));
  }

  private formatearFechaSolo(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  registrarFactura(): void {
    if (!this.clienteSeleccionado) {
      this.abrirModalErrorAuto('Selecciona un cliente.');
      return;
    }

    if (this.items.length === 0) {
      this.abrirModalErrorAuto('Agrega al menos un producto.');
      return;
    }

    const cliId = Number(this.clienteSeleccionado.cliId ?? 0);
    const tpaId = Number(this.tipoPagoId ?? 0);

    const dto: FacturaCrearDto = {
      cliId,
      tpaId,
      facFecha: this.formatearFechaSolo(new Date()), // ✅ CORREGIDO
      detalles: this.items.map(i => ({
        prodId: i.prodId,
        cantidad: i.cantidad,
        precio: i.precioUnitario // ✅ FALTABA ESTO
      }))
    };

    this.cargando = true;
    this.cdRef.detectChanges();

    this.facturaService.crear(dto)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.cargando = false;
          this.abrirModalOkAuto('Factura registrada correctamente.');
        },
        error: (err: any) => {
          this.cargando = false;
          this.abrirModalErrorAuto(this.extraerMensajeError(err, 'Error al registrar la factura.'));
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
      this.router.navigate(['/panel/factura-lista']);
    }, 2000);
  }

  private abrirModalErrorAuto(msg: string): void {
    this.modalErrorMensaje = msg;
    this.modalErrorVisible = true;
    this.cdRef.detectChanges();

    if (this.errTimer) clearTimeout(this.errTimer);

    this.errTimer = setTimeout(() => {
      this.modalErrorVisible = false;
      this.modalErrorMensaje = '';
      this.cdRef.detectChanges();
    }, 2500);
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

    if (typeof err?.error === 'string' && err.error.trim()) {
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