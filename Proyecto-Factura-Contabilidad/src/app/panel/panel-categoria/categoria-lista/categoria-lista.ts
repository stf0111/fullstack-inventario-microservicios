import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { CategoriaService, CategoriaListadoDto, CategoriaEditarDto } from '../../../servicios/categoria.service';

type CategoriaVM = CategoriaListadoDto;
type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

@Component({
  selector: 'app-categoria-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categoria-lista.html',
  styleUrls: ['./categoria-lista.css'],
})
export class CategoriaLista implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private categoriaService = inject(CategoriaService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  categorias: CategoriaVM[] = [];

  terminoBusqueda = '';

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  paginaActual = 1;
  tamanoPagina = 15;

  modalEditarVisible = false;
  editCategoria: CategoriaVM | null = null;
  editNombre = '';
  editError = '';
  editCargando = false;

  confirmVisible = false;
  confirmMensaje = '';
  confirmTitulo = 'Eliminar categoría';
  categoriaSeleccionada: CategoriaVM | null = null;

  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: any = null;

  get categoriasFiltradas(): CategoriaVM[] {
    let lista = [...this.categorias];

    const t = this.terminoBusqueda.trim().toLowerCase();
    if (t) {
      lista = lista.filter((x) => {
        const cod = this.obtenerCodigo(x).toLowerCase();
        const nom = this.obtenerNombre(x).toLowerCase();
        return cod.includes(t) || nom.includes(t);
      });
    }

    return lista;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.categoriasFiltradas.length / this.tamanoPagina));
  }

  get categoriasPaginaActual(): CategoriaVM[] {
    const datos = this.categoriasFiltradas;
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return datos.slice(inicio, inicio + this.tamanoPagina);
  }

  ngOnInit(): void {
    this.cargarSesionYCategorias();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  private cargarSesionYCategorias(): void {
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

        this.cargarCategorias();
      },
      error: () => {
        this.cargando = false;
        this.router.navigate(['/login']);
      },
    });
  }

  private cargarCategorias(mantenerMensajes = false): void {
    this.cargando = true;

    if (!mantenerMensajes) {
      this.mensajeError = '';
      this.mensajeOk = '';
    }

    this.cdRef.detectChanges();

    this.categoriaService.listar({
      pagina: 1,
      registrosPorPagina: 1000
    }).pipe(take(1)).subscribe({
      next: (response) => {
        this.categorias = Array.isArray(response?.datos) ? response.datos : [];
        this.paginaActual = 1;
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.categorias = [];
        this.paginaActual = 1;
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'No se pudieron cargar las categorías.');
        this.cdRef.detectChanges();
      },
    });
  }

  aplicarFiltros(): void {
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
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

  obtenerCodigo(x: CategoriaVM): string {
    return String(x?.catId ?? '');
  }

  obtenerNombre(x: CategoriaVM): string {
    return String(x?.catNombre ?? '').trim() || '(sin nombre)';
  }

  private extraerMensajeError(err: any, porDefecto: string): string {
    if (!err) return porDefecto;

    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error && typeof err.error === 'object') {
      if (typeof err.error.mensaje === 'string' && err.error.mensaje.trim()) return err.error.mensaje;
      if (typeof err.error.message === 'string' && err.error.message.trim()) return err.error.message;
      if (typeof err.error.title === 'string' && err.error.title.trim()) return err.error.title;
      if (typeof err.error.detail === 'string' && err.error.detail.trim()) return err.error.detail;
    }

    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    return porDefecto;
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
    }, 2000);
  }

  private ajustarPaginaDespuesDeCambios(): void {
    const total = this.totalPaginas;
    if (this.paginaActual > total) this.paginaActual = total;
    if (this.paginaActual < 1) this.paginaActual = 1;
  }

  nuevaCategoria(): void {
    if (!this.esAdminUI()) return;
    this.router.navigate(['/panel/categoria-crear']);
  }

  modificarCategoria(x: CategoriaVM): void {
    if (!this.esAdminUI()) return;

    this.editCategoria = x;
    this.editNombre = String(x?.catNombre ?? '').trim();
    this.editError = '';
    this.editCargando = false;
    this.modalEditarVisible = true;
    this.cdRef.detectChanges();
  }

  cerrarModalEditar(): void {
    if (this.editCargando) return;

    this.modalEditarVisible = false;
    this.editCategoria = null;
    this.editNombre = '';
    this.editError = '';
    this.cdRef.detectChanges();
  }

  guardarEdicion(): void {
    if (this.editCargando) return;
    if (!this.esAdminUI()) return;

    if (!this.editCategoria) {
      this.editError = 'No hay categoría seleccionada.';
      this.cdRef.detectChanges();
      return;
    }

    const nombre = (this.editNombre ?? '').trim();
    if (!nombre) {
      this.editError = 'El nombre de la categoría es obligatorio.';
      this.cdRef.detectChanges();
      return;
    }

    this.editError = '';
    this.editCargando = true;
    this.cdRef.detectChanges();

    const dto: CategoriaEditarDto = {
      catNombre: nombre
    };

    this.categoriaService.editar(Number(this.editCategoria.catId), dto).pipe(take(1)).subscribe({
      next: () => {
        const idx = this.categorias.findIndex(t => Number(t?.catId) === Number(this.editCategoria?.catId));
        if (idx >= 0) {
          this.categorias[idx] = { ...this.categorias[idx], catNombre: dto.catNombre };
        }

        this.editCargando = false;
        this.modalEditarVisible = false;
        this.mensajeOk = 'Categoría actualizada correctamente.';
        this.mensajeError = '';
        this.cdRef.detectChanges();

        this.abrirModalOkAuto('Categoría actualizada correctamente.');
      },
      error: (err) => {
        if (err?.status === 200) {
          const idx = this.categorias.findIndex(t => Number(t?.catId) === Number(this.editCategoria?.catId));
          if (idx >= 0) {
            this.categorias[idx] = { ...this.categorias[idx], catNombre: dto.catNombre };
          }

          this.editCargando = false;
          this.modalEditarVisible = false;
          this.mensajeOk = 'Categoría actualizada correctamente.';
          this.mensajeError = '';
          this.cdRef.detectChanges();

          this.abrirModalOkAuto('Categoría actualizada correctamente.');
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.editCargando = false;
        this.editError = this.extraerMensajeError(err, 'Error al actualizar la categoría.');
        this.cdRef.detectChanges();
      }
    });
  }

  eliminarCategoria(x: CategoriaVM): void {
    if (!this.esAdminUI()) return;

    this.categoriaSeleccionada = x;
    this.confirmMensaje = `¿Seguro que deseas eliminar la categoría "${this.obtenerNombre(x)}"?`;
    this.confirmVisible = true;
    this.cdRef.detectChanges();
  }

  cancelarConfirmacion(): void {
    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.categoriaSeleccionada = null;
    this.cdRef.detectChanges();
  }

  confirmarEliminacion(): void {
    const x = this.categoriaSeleccionada;

    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.categoriaSeleccionada = null;
    this.cdRef.detectChanges();

    if (!x) return;

    this.ejecutarEliminarCategoria(x);
  }

  private ejecutarEliminarCategoria(x: CategoriaVM): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.categoriaService.eliminar(Number(x.catId)).pipe(take(1)).subscribe({
      next: () => {
        this.categorias = this.categorias.filter(t => Number(t.catId) !== Number(x.catId));
        this.ajustarPaginaDespuesDeCambios();
        this.cargando = false;
        this.mensajeOk = 'Categoría eliminada correctamente.';
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.categorias = this.categorias.filter(t => Number(t.catId) !== Number(x.catId));
          this.ajustarPaginaDespuesDeCambios();
          this.cargando = false;
          this.mensajeOk = 'Categoría eliminada correctamente.';
          this.cdRef.detectChanges();
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al eliminar la categoría.');
        this.cdRef.detectChanges();
      },
    });
  }
}