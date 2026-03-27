import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ProductoService, ProductoListadoDto, ProductoEditarDto } from '../../../servicios/producto.service';
import { MarcaService, MarcaListadoDto } from '../../../servicios/marca.service';
import { CategoriaService, CategoriaListadoDto } from '../../../servicios/categoria.service';

type EstadoFiltro = 'ACTIVOS' | 'INACTIVOS' | 'TODOS';
type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

type ProductoVM = ProductoListadoDto;

@Component({
  selector: 'app-producto-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './producto-lista.html',
  styleUrls: ['./producto-lista.css'],
})
export class ProductoLista implements OnInit {
  private authService = inject(AuthService);
  private productoService = inject(ProductoService);
  private marcaService = inject(MarcaService);
  private categoriaService = inject(CategoriaService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  productos: ProductoVM[] = [];
  marcas: MarcaListadoDto[] = [];
  categorias: CategoriaListadoDto[] = [];

  terminoBusqueda = '';
  filtroMarcaId: number | null = null;
  filtroCategoriaId: number | null = null;
  filtroEstado: EstadoFiltro = 'TODOS';

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  paginaActual = 1;
  tamanoPagina = 15;

  confirmVisible = false;
  confirmMensaje = '';
  confirmTitulo = 'Eliminar producto';
  confirmTipo: 'estado' | 'delete' | null = null;
  confirmProducto: ProductoVM | null = null;

  modalDetalleVisible = false;
  productoSeleccionado: ProductoVM | null = null;

  get productosFiltrados(): ProductoVM[] {
    let lista = [...this.productos];

    const t = this.terminoBusqueda.trim().toLowerCase();
    if (t) {
      lista = lista.filter((p) => {
        const cod = this.obtenerCodigo(p).toLowerCase();
        const nom = this.obtenerNombreProducto(p).toLowerCase();
        const marca = this.obtenerMarcaTexto(p).toLowerCase();
        const categoria = this.obtenerCategoriaTexto(p).toLowerCase();

        return cod.includes(t) || nom.includes(t) || marca.includes(t) || categoria.includes(t);
      });
    }

    if (this.filtroEstado === 'ACTIVOS') {
      lista = lista.filter((p) => this.esActivo(p));
    }

    if (this.filtroEstado === 'INACTIVOS') {
      lista = lista.filter((p) => !this.esActivo(p));
    }

    if (this.filtroMarcaId != null) {
      lista = lista.filter((p) => Number(p?.marcaId ?? 0) === Number(this.filtroMarcaId));
    }

    if (this.filtroCategoriaId != null) {
      lista = lista.filter((p) => Number(p?.catId ?? 0) === Number(this.filtroCategoriaId));
    }

    return lista;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.productosFiltrados.length / this.tamanoPagina));
  }

  get productosPaginaActual(): ProductoVM[] {
    const datos = this.productosFiltrados;
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return datos.slice(inicio, inicio + this.tamanoPagina);
  }

  ngOnInit(): void {
    this.cargarSesionYData();
  }

  private cargarSesionYData(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.authService.me().pipe(take(1)).subscribe({
      next: (response) => {
        const me = response?.datos;

        if (!me || !this.esRolValido(me.usuRol)) {
          this.cargando = false;
          this.router.navigate(['/login']);
          return;
        }

        this.usuarioActual = me;
        this.rolUsuario = me.usuRol.toUpperCase() as RolApp;

        this.cargarData();
      },
      error: () => {
        this.cargando = false;
        this.router.navigate(['/login']);
      },
    });
  }

  private cargarData(mantenerMensajes = false): void {
    this.cargando = true;

    if (!mantenerMensajes) {
      this.mensajeError = '';
      this.mensajeOk = '';
    }

    this.cdRef.detectChanges();

    forkJoin({
      productos: this.productoService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
        catchError(() => of({ datos: [] }))
      ),
      marcas: this.marcaService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
        map(r => r?.datos ?? []),
        catchError(() => of([]))
      ),
      categorias: this.categoriaService.listar({ pagina: 1, registrosPorPagina: 1000 }).pipe(
        map(r => r?.datos ?? []),
        catchError(() => of([]))
      ),
    }).subscribe({
      next: ({ productos, marcas, categorias }) => {
        this.productos = Array.isArray(productos?.datos) ? productos.datos : [];
        this.marcas = Array.isArray(marcas) ? marcas : [];
        this.categorias = Array.isArray(categorias) ? categorias : [];

        this.paginaActual = 1;
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.productos = [];
        this.marcas = [];
        this.categorias = [];
        this.paginaActual = 1;
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'No se pudieron cargar los productos.');
        this.cdRef.detectChanges();
      },
    });
  }

  buscarProductos(): void {
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroMarcaId = null;
    this.filtroCategoriaId = null;
    this.filtroEstado = 'TODOS';
    this.paginaActual = 1;
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) this.paginaActual--;
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) this.paginaActual++;
  }

  private esRolValido(rol: string | null | undefined): rol is RolApp {
    const r = String(rol ?? '').trim().toUpperCase();
    return r === 'ADMIN' || r === 'OPERADOR' || r === 'VENDEDOR';
  }

  esAdminUI(): boolean {
    return this.rolUsuario === 'ADMIN';
  }

  mostrarBotonModificar(): boolean {
    return this.esAdminUI();
  }

  obtenerCodigo(p: ProductoVM): string {
    return String(p?.prodId ?? '');
  }

  obtenerNombreProducto(p: ProductoVM): string {
    return String(p?.prodNombre ?? '(sin nombre)');
  }

  obtenerMarcaTexto(p: ProductoVM): string {
    return String(p?.marcaNombre ?? this.obtenerNombreMarcaPorId(Number(p?.marcaId ?? 0)) ?? '-');
  }

  obtenerCategoriaTexto(p: ProductoVM): string {
    return String(p?.catNombre ?? this.obtenerNombreCategoriaPorId(Number(p?.catId ?? 0)) ?? '-');
  }

  obtenerPrecioCompra(p: ProductoVM): number {
    return Number(p?.prodPreciocom ?? 0) || 0;
  }

  obtenerPrecioVenta(p: ProductoVM): number {
    return Number(p?.prodPrecioven ?? 0) || 0;
  }

  esActivo(p: ProductoVM): boolean {
    return p?.prodEstado === true;
  }

  obtenerTextoEstado(p: ProductoVM): string {
    return this.esActivo(p) ? 'Activo' : 'Inactivo';
  }

  obtenerClasesEstado(p: ProductoVM): string {
    return this.esActivo(p)
      ? 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-600'
      : 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-rose-50 text-rose-600';
  }

  private obtenerNombreMarcaPorId(id: number): string {
    const m = this.marcas.find(x => Number(x?.marcaId ?? 0) === Number(id));
    return String(m?.marcaNombre ?? '');
  }

  private obtenerNombreCategoriaPorId(id: number): string {
    const c = this.categorias.find(x => Number(x?.catId ?? 0) === Number(id));
    return String(c?.catNombre ?? '');
  }

  private extraerMensajeError(err: any, porDefecto: string): string {
    if (!err) return porDefecto;
    if (typeof err.error === 'string' && err.error.trim()) return err.error;

    if (err.error && typeof err.error === 'object') {
      if (typeof err.error.mensaje === 'string' && err.error.mensaje.trim()) return err.error.mensaje;
      if (typeof err.error.message === 'string' && err.error.message.trim()) return err.error.message;
      if (typeof err.error.title === 'string' && err.error.title.trim()) return err.error.title;
      if (typeof err.error.detail === 'string' && err.error.detail.trim()) return err.error.detail;
    }

    if (typeof err.message === 'string' && err.message.trim()) return err.message;
    return porDefecto;
  }

  private ajustarPaginaDespuesDeCambios(): void {
    const total = this.totalPaginas;
    if (this.paginaActual > total) this.paginaActual = total;
    if (this.paginaActual < 1) this.paginaActual = 1;
  }

  nuevoProducto(): void {
    if (!this.esAdminUI()) return;
    this.router.navigate(['/panel/producto-crear']);
  }

  modificarProducto(p: ProductoVM): void {
    if (!this.esAdminUI()) return;

    const id = Number(p?.prodId);
    if (!Number.isFinite(id)) return;

    this.router.navigate(['/panel/producto-modificar', id]);
  }

  eliminarProducto(p: ProductoVM): void {
    if (!this.esAdminUI()) return;

    this.confirmTipo = 'delete';
    this.confirmProducto = p;
    this.confirmTitulo = 'Eliminar producto';
    this.confirmMensaje = `¿Seguro que deseas eliminar el producto "${this.obtenerNombreProducto(p)}"?`;
    this.confirmVisible = true;
    this.cdRef.detectChanges();
  }

  verDetalles(p: ProductoVM): void {
    this.productoSeleccionado = p;
    this.modalDetalleVisible = true;
    this.cdRef.detectChanges();
  }

  cerrarModalDetalle(): void {
    this.modalDetalleVisible = false;
    this.productoSeleccionado = null;
    this.cdRef.detectChanges();
  }

  cambiarEstadoProducto(p: ProductoVM): void {
    if (!this.esAdminUI()) return;

    const accion = this.esActivo(p) ? 'desactivar' : 'activar';
    this.confirmTipo = 'estado';
    this.confirmProducto = p;
    this.confirmTitulo = 'Cambiar estado';
    this.confirmMensaje = `¿Seguro que deseas ${accion} el producto "${this.obtenerNombreProducto(p)}"?`;
    this.confirmVisible = true;
    this.cdRef.detectChanges();
  }

  cancelarConfirmacion(): void {
    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.confirmTipo = null;
    this.confirmProducto = null;
    this.cdRef.detectChanges();
  }

  confirmarAccion(): void {
    const tipo = this.confirmTipo;
    const p = this.confirmProducto;

    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.confirmTipo = null;
    this.confirmProducto = null;
    this.cdRef.detectChanges();

    if (!p || !tipo) return;

    if (tipo === 'estado') this.ejecutarCambioEstado(p);
    if (tipo === 'delete') this.ejecutarEliminarProducto(p);
  }

  private ejecutarCambioEstado(p: ProductoVM): void {
    const dto: ProductoEditarDto = {
      prodNombre: this.obtenerNombreProducto(p),
      prodDescripcion: p?.prodDescripcion ?? null,
      catId: Number(p?.catId ?? 0),
      marcaId: Number(p?.marcaId ?? 0),
      prodPrecioven: this.obtenerPrecioVenta(p),
      prodPreciocom: this.obtenerPrecioCompra(p),
      prodCantidad: Number(p?.prodCantidad ?? 0),
      prodEstado: !this.esActivo(p),
    };

    if (!Number.isFinite(dto.catId) || dto.catId <= 0) return;
    if (!Number.isFinite(dto.marcaId) || dto.marcaId <= 0) return;

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.productoService.editar(Number(p.prodId), dto).pipe(take(1)).subscribe({
      next: () => {
        this.mensajeOk = dto.prodEstado
          ? 'Producto activado correctamente.'
          : 'Producto desactivado correctamente.';
        this.cargarData(true);
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.mensajeOk = dto.prodEstado
            ? 'Producto activado correctamente.'
            : 'Producto desactivado correctamente.';
          this.cargarData(true);
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al cambiar el estado del producto.');
        this.cdRef.detectChanges();
      }
    });
  }

  private ejecutarEliminarProducto(p: ProductoVM): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.productoService.eliminar(Number(p.prodId)).pipe(take(1)).subscribe({
      next: () => {
        this.productos = this.productos.filter(x => Number(x.prodId) !== Number(p.prodId));
        this.ajustarPaginaDespuesDeCambios();
        this.cargando = false;
        this.mensajeOk = 'Producto eliminado correctamente.';
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.productos = this.productos.filter(x => Number(x.prodId) !== Number(p.prodId));
          this.ajustarPaginaDespuesDeCambios();
          this.cargando = false;
          this.mensajeOk = 'Producto eliminado correctamente.';
          this.cdRef.detectChanges();
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al eliminar el producto.');
        this.cdRef.detectChanges();
      }
    });
  }
}