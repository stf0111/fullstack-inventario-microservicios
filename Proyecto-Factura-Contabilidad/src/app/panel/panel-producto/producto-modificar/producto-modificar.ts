import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ProductoService, ProductoListadoDto, ProductoEditarDto } from '../../../servicios/producto.service';
import { MarcaService, MarcaListadoDto } from '../../../servicios/marca.service';
import { CategoriaService, CategoriaListadoDto } from '../../../servicios/categoria.service';

type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

@Component({
  selector: 'app-producto-modificar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-modificar.html',
  styleUrls: ['./producto-modificar.css'],
})
export class ProductoModificar implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private productoService = inject(ProductoService);
  private marcaService = inject(MarcaService);
  private categoriaService = inject(CategoriaService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  marcas: MarcaListadoDto[] = [];
  categorias: CategoriaListadoDto[] = [];

  agregandoMarca = false;
  nuevaMarcaNombre = '';

  agregandoCategoria = false;
  nuevaCategoriaNombre = '';

  utilidadPorcentaje = 30;
  private ventaEditadaManual = false;
  private autoCalcTimer: any = null;

  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: any = null;

  prodId = 0;

  producto: ProductoListadoDto | null = null;

  ngOnInit(): void {
    const pm = this.route.snapshot.paramMap;
    const qm = this.route.snapshot.queryParamMap;

    const raw =
      pm.get('prodId') ??
      pm.get('id') ??
      qm.get('prodId') ??
      qm.get('id');

    const id = raw != null ? Number(raw) : NaN;

    if (!Number.isFinite(id) || id <= 0) {
      this.mensajeError = 'ID de producto inválido.';
      return;
    }

    this.prodId = id;
    this.cargarSesionYData();
  }

  ngOnDestroy(): void {
    if (this.okTimer) clearTimeout(this.okTimer);
    if (this.autoCalcTimer) clearTimeout(this.autoCalcTimer);
  }

  private cargarSesionYData(): void {
    this.authService.me().pipe(take(1)).subscribe({
      next: (response) => {
        const me = response?.datos;

        if (!me || !this.esRolValido(me.usuRol)) {
          this.router.navigate(['/login']);
          return;
        }

        this.usuarioActual = me;
        this.rolUsuario = me.usuRol.toUpperCase() as RolApp;

        this.cargarTodo();
      },
      error: () => this.router.navigate(['/login']),
    });
  }

  private cargarTodo(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    forkJoin({
      producto: this.productoService.obtenerPorId(this.prodId).pipe(take(1)),
      marcas: this.marcaService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
        take(1),
        map(r => r?.datos ?? []),
        catchError(() => of([]))
      ),
      categorias: this.categoriaService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
        take(1),
        map(r => r?.datos ?? []),
        catchError(() => of([]))
      ),
    }).subscribe({
      next: ({ producto, marcas, categorias }) => {
        const prod = producto?.datos;

        if (!prod) {
          this.cargando = false;
          this.mensajeError = 'No se pudo cargar el producto.';
          this.cdRef.detectChanges();
          return;
        }

        this.producto = { ...prod };
        this.marcas = Array.isArray(marcas) ? marcas : [];
        this.categorias = Array.isArray(categorias) ? categorias : [];

        this.utilidadPorcentaje = this.calcularUtilidadDesdePrecios(
          Number(this.producto.prodPreciocom),
          Number(this.producto.prodPrecioven)
        );

        this.ventaEditadaManual = true;
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al cargar el producto.');
        this.cdRef.detectChanges();
      }
    });
  }

  private esRolValido(rol: string | null | undefined): rol is RolApp {
    const r = String(rol ?? '').trim().toUpperCase();
    return r === 'ADMIN' || r === 'OPERADOR' || r === 'VENDEDOR';
  }

  esAdminUI(): boolean {
    return this.rolUsuario === 'ADMIN';
  }

  guardarNuevaMarca(): void {
    this.mensajeError = '';
    this.mensajeOk = '';

    const nombre = (this.nuevaMarcaNombre ?? '').trim();
    if (!nombre) {
      return this.setError('Ingrese el nombre de la nueva marca.');
    }

    this.marcaService.crear({ marcaNombre: nombre }).pipe(take(1)).subscribe({
      next: (response) => {
        const nueva = response?.datos;

        this.agregandoMarca = false;
        this.nuevaMarcaNombre = '';

        this.marcaService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
          take(1),
          map(r => r?.datos ?? []),
          catchError(() => of([]))
        ).subscribe((lista) => {
          this.marcas = Array.isArray(lista) ? lista : [];

          const nuevoId = Number(nueva?.marcaId ?? 0);
          if (this.producto && Number.isFinite(nuevoId) && nuevoId > 0) {
            this.producto.marcaId = nuevoId;
            this.producto.marcaNombre = nueva?.marcaNombre ?? nombre;
          }

          this.cdRef.detectChanges();
        });

        this.mensajeOk = 'Marca creada correctamente.';
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.agregandoMarca = false;
          this.nuevaMarcaNombre = '';
          this.recargarCombos();
          this.mensajeOk = 'Marca creada correctamente.';
          this.cdRef.detectChanges();
          return;
        }

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

    const nombre = (this.nuevaCategoriaNombre ?? '').trim();
    if (!nombre) {
      return this.setError('Ingrese el nombre de la nueva categoría.');
    }

    this.categoriaService.crear({ catNombre: nombre }).pipe(take(1)).subscribe({
      next: (response) => {
        const nueva = response?.datos;

        this.agregandoCategoria = false;
        this.nuevaCategoriaNombre = '';

        this.categoriaService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
          take(1),
          map(r => r?.datos ?? []),
          catchError(() => of([]))
        ).subscribe((lista) => {
          this.categorias = Array.isArray(lista) ? lista : [];

          const nuevoId = Number(nueva?.catId ?? 0);
          if (this.producto && Number.isFinite(nuevoId) && nuevoId > 0) {
            this.producto.catId = nuevoId;
            this.producto.catNombre = nueva?.catNombre ?? nombre;
          }

          this.cdRef.detectChanges();
        });

        this.mensajeOk = 'Categoría creada correctamente.';
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.agregandoCategoria = false;
          this.nuevaCategoriaNombre = '';
          this.recargarCombos();
          this.mensajeOk = 'Categoría creada correctamente.';
          this.cdRef.detectChanges();
          return;
        }

        this.setError(this.extraerMensajeError(err, 'Error creando categoría.'));
      },
    });
  }

  cancelarNuevaCategoria(): void {
    this.agregandoCategoria = false;
    this.nuevaCategoriaNombre = '';
  }

  private recargarCombos(): void {
    forkJoin({
      marcas: this.marcaService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
        take(1),
        map(r => r?.datos ?? []),
        catchError(() => of([]))
      ),
      categorias: this.categoriaService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
        take(1),
        map(r => r?.datos ?? []),
        catchError(() => of([]))
      ),
    }).subscribe(({ marcas, categorias }) => {
      this.marcas = Array.isArray(marcas) ? marcas : [];
      this.categorias = Array.isArray(categorias) ? categorias : [];
      this.cdRef.detectChanges();
    });
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
    if (this.autoCalcTimer) clearTimeout(this.autoCalcTimer);
    this.autoCalcTimer = setTimeout(() => this.recalcularVentaAhora(), 400);
  }

  private recalcularVentaAhora(): void {
    if (!this.producto) return;

    const compra = Number(this.producto.prodPreciocom);
    const u = Number(this.utilidadPorcentaje);

    if (!Number.isFinite(compra) || compra <= 0) return;
    if (!Number.isFinite(u) || u < 0) return;
    if (this.ventaEditadaManual) return;

    const factor = 1 - (u / 100);

    if (factor <= 0) {
      this.setError('La utilidad no puede ser 100% o más.');
      return;
    }

    const venta = compra / factor;
    this.producto.prodPrecioven = Number(venta.toFixed(2));
    this.cdRef.detectChanges();
  }

  private calcularUtilidadDesdePrecios(compra: number, venta: number): number {
    if (!Number.isFinite(compra) || compra <= 0) return 30;
    if (!Number.isFinite(venta) || venta <= 0) return 30;

    const u = (1 - (compra / venta)) * 100;
    const red = Math.round(u);

    return Number.isFinite(red) && red >= 0 ? red : 30;
  }

  guardarCambios(): void {
    if (!this.producto) return;
    if (this.cargando) return;

    if (!this.esAdminUI()) {
      return this.setError('Sin permisos: solo un administrador puede modificar productos.');
    }

    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    const nombre = (this.producto.prodNombre ?? '').trim();
    if (!nombre) return this.setError('El nombre del producto es obligatorio.');

    const compra = Number(this.producto.prodPreciocom);
    const venta = Number(this.producto.prodPrecioven);
    const cantidad = Number(this.producto.prodCantidad);

    if (!Number.isFinite(compra) || compra <= 0) {
      return this.setError('Ingrese un precio de compra válido (> 0).');
    }

    if (!Number.isFinite(venta) || venta <= 0) {
      return this.setError('Ingrese un precio de venta válido (> 0).');
    }

    if (!Number.isFinite(cantidad) || cantidad < 0) {
      return this.setError('Ingrese una cantidad válida (0 o mayor).');
    }

    const marcaId = Number(this.producto.marcaId);
    const catId = Number(this.producto.catId);

    if (!Number.isFinite(marcaId) || marcaId <= 0) {
      return this.setError('Seleccione una marca.');
    }

    if (!Number.isFinite(catId) || catId <= 0) {
      return this.setError('Seleccione una categoría.');
    }

    const dtoActualizar: ProductoEditarDto = {
      prodNombre: nombre,
      prodDescripcion: (this.producto.prodDescripcion ?? '').trim() || null,
      catId,
      marcaId,
      prodPrecioven: venta,
      prodPreciocom: compra,
      prodCantidad: cantidad,
      prodEstado: this.producto.prodEstado === true
    };

    this.cargando = true;
    this.cdRef.detectChanges();

    this.productoService.editar(this.producto.prodId, dtoActualizar).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeOk = 'Producto actualizado correctamente.';
        this.cdRef.detectChanges();
        this.abrirModalOkAuto('Producto actualizado correctamente.');
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.cargando = false;
          this.mensajeOk = 'Producto actualizado correctamente.';
          this.cdRef.detectChanges();
          this.abrirModalOkAuto('Producto actualizado correctamente.');
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al actualizar el producto.');
        this.cdRef.detectChanges();
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
      this.router.navigate(['/panel/producto-lista']);
    }, 2000);
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

      if (lista.length) return lista.join(' | ');
    }

    if (err.error && typeof err.error === 'object') {
      const message =
        (typeof err.error.mensaje === 'string' && err.error.mensaje) ||
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

  volver(): void {
    this.router.navigate(['/panel/producto-lista']);
  }

  trackById(_: number, item: any) {
    return item?.marcaId ?? item?.catId ?? item?.id ?? _;
  }
}