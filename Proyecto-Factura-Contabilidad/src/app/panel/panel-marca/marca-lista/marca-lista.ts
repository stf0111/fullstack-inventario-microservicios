import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { MarcaService, MarcaListadoDto, MarcaEditarDto } from '../../../servicios/marca.service';

type MarcaVM = MarcaListadoDto;
type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

@Component({
  selector: 'app-marca-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marca-lista.html',
  styleUrls: ['./marca-lista.css'],
})

export class MarcaLista implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private marcaService = inject(MarcaService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  marcas: MarcaVM[] = [];

  terminoBusqueda = '';

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  paginaActual = 1;
  tamanoPagina = 15;

  modalEditarVisible = false;
  editMarca: MarcaVM | null = null;
  editNombre = '';
  editError = '';
  editCargando = false;

  confirmVisible = false;
  confirmMensaje = '';
  confirmTitulo = 'Eliminar marca';
  marcaSeleccionada: MarcaVM | null = null;

  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: any = null;

  get marcasFiltradas(): MarcaVM[] {
    let lista = [...this.marcas];

    const t = this.terminoBusqueda.trim().toLowerCase();
    if (t) {
      lista = lista.filter((m) => {
        const cod = this.obtenerCodigo(m).toLowerCase();
        const nom = this.obtenerNombre(m).toLowerCase();
        return cod.includes(t) || nom.includes(t);
      });
    }

    return lista;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.marcasFiltradas.length / this.tamanoPagina));
  }

  get marcasPaginaActual(): MarcaVM[] {
    const datos = this.marcasFiltradas;
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return datos.slice(inicio, inicio + this.tamanoPagina);
  }

  ngOnInit(): void {
    this.cargarSesionYMarcas();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  private cargarSesionYMarcas(): void {
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

        this.cargarMarcas();
      },
      error: () => {
        this.cargando = false;
        this.router.navigate(['/login']);
      },
    });
  }

  private cargarMarcas(mantenerMensajes = false): void {
    this.cargando = true;

    if (!mantenerMensajes) {
      this.mensajeError = '';
      this.mensajeOk = '';
    }

    this.cdRef.detectChanges();

    this.marcaService.listar({
      pagina: 1,
      registrosPorPagina: 1000
    }).pipe(take(1)).subscribe({
      next: (response) => {
        this.marcas = Array.isArray(response?.datos) ? response.datos : [];
        this.paginaActual = 1;
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.marcas = [];
        this.paginaActual = 1;
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'No se pudieron cargar las marcas.');
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

  obtenerCodigo(m: MarcaVM): string {
    return String(m?.marcaId ?? '');
  }

  obtenerNombre(m: MarcaVM): string {
    return String(m?.marcaNombre ?? '').trim() || '(sin nombre)';
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

  nuevaMarca(): void {
    if (!this.esAdminUI()) return;
    this.router.navigate(['/panel/marca-crear']);
  }

  modificarMarca(m: MarcaVM): void {
    if (!this.esAdminUI()) return;

    this.editMarca = m;
    this.editNombre = String(m?.marcaNombre ?? '').trim();
    this.editError = '';
    this.editCargando = false;
    this.modalEditarVisible = true;
    this.cdRef.detectChanges();
  }

  cerrarModalEditar(): void {
    if (this.editCargando) return;

    this.modalEditarVisible = false;
    this.editMarca = null;
    this.editNombre = '';
    this.editError = '';
    this.cdRef.detectChanges();
  }

  guardarEdicion(): void {
    if (this.editCargando) return;
    if (!this.esAdminUI()) return;

    if (!this.editMarca) {
      this.editError = 'No hay marca seleccionada.';
      this.cdRef.detectChanges();
      return;
    }

    const nombre = (this.editNombre ?? '').trim();
    if (!nombre) {
      this.editError = 'El nombre de la marca es obligatorio.';
      this.cdRef.detectChanges();
      return;
    }

    this.editError = '';
    this.editCargando = true;
    this.cdRef.detectChanges();

    const dto: MarcaEditarDto = {
      marcaNombre: nombre
    };

    this.marcaService.editar(Number(this.editMarca.marcaId), dto).pipe(take(1)).subscribe({
      next: () => {
        const idx = this.marcas.findIndex(x => Number(x?.marcaId) === Number(this.editMarca?.marcaId));
        if (idx >= 0) {
          this.marcas[idx] = { ...this.marcas[idx], marcaNombre: dto.marcaNombre };
        }

        this.editCargando = false;
        this.modalEditarVisible = false;
        this.mensajeOk = 'Marca actualizada correctamente.';
        this.mensajeError = '';
        this.cdRef.detectChanges();

        this.abrirModalOkAuto('Marca actualizada correctamente.');
      },
      error: (err) => {
        if (err?.status === 200) {
          const idx = this.marcas.findIndex(x => Number(x?.marcaId) === Number(this.editMarca?.marcaId));
          if (idx >= 0) {
            this.marcas[idx] = { ...this.marcas[idx], marcaNombre: dto.marcaNombre };
          }

          this.editCargando = false;
          this.modalEditarVisible = false;
          this.mensajeOk = 'Marca actualizada correctamente.';
          this.mensajeError = '';
          this.cdRef.detectChanges();

          this.abrirModalOkAuto('Marca actualizada correctamente.');
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.editCargando = false;
        this.editError = this.extraerMensajeError(err, 'Error al actualizar la marca.');
        this.cdRef.detectChanges();
      }
    });
  }

  eliminarMarca(m: MarcaVM): void {
    if (!this.esAdminUI()) return;

    this.marcaSeleccionada = m;
    this.confirmMensaje = `¿Seguro que deseas eliminar la marca "${this.obtenerNombre(m)}"?`;
    this.confirmVisible = true;
    this.cdRef.detectChanges();
  }

  cancelarConfirmacion(): void {
    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.marcaSeleccionada = null;
    this.cdRef.detectChanges();
  }

  confirmarEliminacion(): void {
    const m = this.marcaSeleccionada;

    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.marcaSeleccionada = null;
    this.cdRef.detectChanges();

    if (!m) return;

    this.ejecutarEliminarMarca(m);
  }

  private ejecutarEliminarMarca(m: MarcaVM): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.marcaService.eliminar(Number(m.marcaId)).pipe(take(1)).subscribe({
      next: () => {
        this.marcas = this.marcas.filter(x => Number(x.marcaId) !== Number(m.marcaId));
        this.ajustarPaginaDespuesDeCambios();
        this.cargando = false;
        this.mensajeOk = 'Marca eliminada correctamente.';
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.marcas = this.marcas.filter(x => Number(x.marcaId) !== Number(m.marcaId));
          this.ajustarPaginaDespuesDeCambios();
          this.cargando = false;
          this.mensajeOk = 'Marca eliminada correctamente.';
          this.cdRef.detectChanges();
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al eliminar la marca.');
        this.cdRef.detectChanges();
      },
    });
  }
}