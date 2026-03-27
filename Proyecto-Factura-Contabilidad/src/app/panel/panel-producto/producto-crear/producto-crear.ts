import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ProductoService } from '../../../servicios/producto.service';
import { MarcaService } from '../../../servicios/marca.service';
import { CategoriaService } from '../../../servicios/categoria.service';

@Component({
  selector: 'app-producto-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-crear.html',
  styleUrls: ['./producto-crear.css'],
})
export class ProductoCrear implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private productoService = inject(ProductoService);
  private marcaService = inject(MarcaService);
  private categoriaService = inject(CategoriaService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario = '';

  marcas: any[] = [];
  categorias: any[] = [];

  agregandoMarca = false;
  nuevaMarcaNombre = '';

  agregandoCategoria = false;
  nuevaCategoriaNombre = '';

  utilidadPorcentaje = 30;
  private ventaEditadaManual = false;
  private autoCalcTimer: ReturnType<typeof setTimeout> | null = null;

  producto = {
    prodNombre: '',
    prodDescripcion: '',
    marcaId: null as number | null,
    catId: null as number | null,
    prodPreciocom: null as number | null,
    prodPrecioven: null as number | null,
    prodEstado: true,
  };

  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.cargarSesionYData();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }

    if (this.autoCalcTimer) {
      clearTimeout(this.autoCalcTimer);
      this.autoCalcTimer = null;
    }
  }

  private cargarSesionYData(): void {
    this.authService.me().pipe(take(1)).subscribe({
      next: (response) => {
        const me = response?.datos ?? null;

        if (!me) {
          this.router.navigate(['/login']);
          return;
        }

        this.usuarioActual = me;
        this.rolUsuario = this.esAdmin(me.usuRol) ? 'ADMIN' : String(me.usuRol ?? 'Usuario');
        this.cargarCombos();
      },
      error: () => this.router.navigate(['/login']),
    });
  }

  private esAdmin(rol: string | null | undefined): boolean {
    const r = String(rol ?? '').trim().toLowerCase();
    return r === 'adm' || r === 'admin' || r.startsWith('admin') || r.includes('administrador');
  }

  esAdminUI(): boolean {
    return this.esAdmin(this.usuarioActual?.usuRol);
  }

  volver(): void {
    this.router.navigate(['/panel/producto-lista']);
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
      this.router.navigate(['/panel/producto-lista']);
    }, 2000);
  }

  private cargarCombos(): void {
    forkJoin({
      marcas: this.getMarcas$().pipe(catchError(() => of([]))),
      categorias: this.getCategorias$().pipe(catchError(() => of([]))),
    })
      .pipe(take(1))
      .subscribe({
        next: ({ marcas, categorias }) => {
          this.marcas = marcas;
          this.categorias = categorias;
          this.cdRef.detectChanges();
        },
      });
  }

  private getMarcas$() {
    return this.marcaService
      .listar({ pagina: 1, registrosPorPagina: 1000 })
      .pipe(map((resp: any) => this.extraerLista(resp)));
  }

  private getCategorias$() {
    return this.categoriaService
      .listar({ pagina: 1, registrosPorPagina: 1000 })
      .pipe(map((resp: any) => this.extraerLista(resp)));
  }

  guardarNuevaMarca(): void {
    this.mensajeError = '';
    this.mensajeOk = '';

    const nombre = String(this.nuevaMarcaNombre ?? '').trim();
    if (!nombre) {
      this.setError('Ingrese el nombre de la nueva marca.');
      return;
    }

    this.marcaService.crear({ marcaNombre: nombre }).pipe(take(1)).subscribe({
      next: (resp: any) => {
        const creado = resp?.datos ?? resp;
        const nuevoId = Number(creado?.marcaId);

        this.agregandoMarca = false;
        this.nuevaMarcaNombre = '';

        this.getMarcas$().pipe(take(1)).subscribe((lista: any[]) => {
          this.marcas = lista;

          if (Number.isFinite(nuevoId) && nuevoId > 0) {
            this.producto.marcaId = nuevoId;
          }

          this.mensajeOk = 'Marca creada correctamente.';
          this.cdRef.detectChanges();
        });
      },
      error: (err: any) => {
        this.setError(this.extraerMensajeError(err, 'Error creando marca.'));
      },
    });
  }

  cancelarNuevaMarca(): void {
    this.agregandoMarca = false;
    this.nuevaMarcaNombre = '';
  }

  guardarNuevaCategoria(): void {
    this.mensajeError = '';
    this.mensajeOk = '';

    const nombre = String(this.nuevaCategoriaNombre ?? '').trim();
    if (!nombre) {
      this.setError('Ingrese el nombre de la nueva categoría.');
      return;
    }

    this.categoriaService.crear({ catNombre: nombre }).pipe(take(1)).subscribe({
      next: (resp: any) => {
        const creada = resp?.datos ?? resp;
        const nuevoId = Number(creada?.catId);

        this.agregandoCategoria = false;
        this.nuevaCategoriaNombre = '';

        this.getCategorias$().pipe(take(1)).subscribe((lista: any[]) => {
          this.categorias = lista;

          if (Number.isFinite(nuevoId) && nuevoId > 0) {
            this.producto.catId = nuevoId;
          }

          this.mensajeOk = 'Categoría creada correctamente.';
          this.cdRef.detectChanges();
        });
      },
      error: (err: any) => {
        this.setError(this.extraerMensajeError(err, 'Error creando categoría.'));
      },
    });
  }

  cancelarNuevaCategoria(): void {
    this.agregandoCategoria = false;
    this.nuevaCategoriaNombre = '';
  }

  onPrecioCompraInput(): void {
    this.recalcularVentaConDelay();
  }

  onUtilidadInput(): void {
    this.recalcularVentaConDelay();
  }

  onPrecioVentaInput(): void {
    this.ventaEditadaManual = true;
  }

  activarCalculoAutomatico(): void {
    this.ventaEditadaManual = false;
    this.recalcularVentaAhora();
  }

  private recalcularVentaConDelay(): void {
    if (this.autoCalcTimer) {
      clearTimeout(this.autoCalcTimer);
    }

    this.autoCalcTimer = setTimeout(() => this.recalcularVentaAhora(), 400);
  }

  private recalcularVentaAhora(): void {
    const compra = Number(this.producto.prodPreciocom);
    const utilidad = Number(this.utilidadPorcentaje);

    if (!Number.isFinite(compra) || compra <= 0) return;
    if (!Number.isFinite(utilidad) || utilidad < 0) return;
    if (this.ventaEditadaManual) return;

    const factor = 1 - utilidad / 100;

    if (factor <= 0) {
      this.setError('La utilidad no puede ser 100% o más.');
      return;
    }

    const venta = compra / factor;
    this.producto.prodPrecioven = Number(venta.toFixed(2));
    this.cdRef.detectChanges();
  }

  guardarProducto(): void {
    if (this.cargando) return;

    if (!this.esAdminUI()) {
      this.setError('Sin permisos: solo un administrador puede crear productos.');
      return;
    }

    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    const nombre = String(this.producto.prodNombre ?? '').trim();
    const descripcion = String(this.producto.prodDescripcion ?? '').trim();
    const compra = Number(this.producto.prodPreciocom);
    const venta = Number(this.producto.prodPrecioven);
    const marcaId = Number(this.producto.marcaId);
    const catId = Number(this.producto.catId);

    if (!nombre) {
      this.setError('El nombre del producto es obligatorio.');
      return;
    }

    if (!Number.isFinite(compra) || compra <= 0) {
      this.setError('Ingrese un precio de compra válido mayor a 0.');
      return;
    }

    if (!Number.isFinite(venta) || venta <= 0) {
      this.setError('Ingrese un precio de venta válido mayor a 0.');
      return;
    }

    if (!Number.isFinite(marcaId) || marcaId <= 0) {
      this.setError('Seleccione una marca.');
      return;
    }

    if (!Number.isFinite(catId) || catId <= 0) {
      this.setError('Seleccione una categoría.');
      return;
    }

    const dto = {
      prodNombre: nombre,
      prodDescripcion: descripcion || null,
      catId,
      marcaId,
      prodPrecioven: venta,
      prodPreciocom: compra,
      prodCantidad: 0,
      prodEstado: true,
    };

    this.cargando = true;
    this.cdRef.detectChanges();

    this.productoService.crear(dto).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeOk = 'Producto creado correctamente.';
        this.resetFormulario();
        this.cdRef.detectChanges();
        this.abrirModalOkAuto(this.mensajeOk);
      },
      error: (err: any) => {
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al crear el producto.');
        this.cdRef.detectChanges();
      },
    });
  }

  private resetFormulario(): void {
    this.producto = {
      prodNombre: '',
      prodDescripcion: '',
      marcaId: null,
      catId: null,
      prodPreciocom: null,
      prodPrecioven: null,
      prodEstado: true,
    };

    this.utilidadPorcentaje = 30;
    this.ventaEditadaManual = false;
  }

  private extraerLista(resp: any): any[] {
    if (Array.isArray(resp)) return resp;

    const datos =
      resp?.datos ??
      resp?.data ??
      resp?.items ??
      resp?.registros ??
      [];

    return Array.isArray(datos) ? datos : [];
  }

  private setError(msg: string): void {
    this.mensajeError = msg;
    this.cdRef.detectChanges();
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
        (typeof err.error.mensaje === 'string' && err.error.mensaje) ||
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

  trackById(index: number, item: any) {
    return item?.marcaId ?? item?.catId ?? item?.id ?? index;
  }
}