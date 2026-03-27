import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { TipoPagoService, TipoPagoListadoDto, TipoPagoEditarDto } from '../../../servicios/tipo-pago.service';

type TipoPagoVM = TipoPagoListadoDto;
type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

@Component({
  selector: 'app-tipo-pago-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipo-pago-lista.html',
  styleUrls: ['./tipo-pago-lista.css'],
})
export class TipoPagoLista implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private tipoPagoService = inject(TipoPagoService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  tiposPago: TipoPagoVM[] = [];

  terminoBusqueda = '';

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  paginaActual = 1;
  tamanoPagina = 15;

  modalEditarVisible = false;
  editTipoPago: TipoPagoVM | null = null;
  editNombre = '';
  editError = '';
  editCargando = false;

  confirmVisible = false;
  confirmMensaje = '';
  confirmTitulo = 'Eliminar tipo de pago';
  tipoPagoSeleccionado: TipoPagoVM | null = null;

  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: any = null;

  get tiposPagoFiltrados(): TipoPagoVM[] {
    let lista = [...this.tiposPago];

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
    return Math.max(1, Math.ceil(this.tiposPagoFiltrados.length / this.tamanoPagina));
  }

  get tiposPagoPaginaActual(): TipoPagoVM[] {
    const datos = this.tiposPagoFiltrados;
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return datos.slice(inicio, inicio + this.tamanoPagina);
  }

  ngOnInit(): void {
    this.cargarSesionYTiposPago();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  private cargarSesionYTiposPago(): void {
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

        this.cargarTiposPago();
      },
      error: () => {
        this.cargando = false;
        this.router.navigate(['/login']);
      },
    });
  }

  private cargarTiposPago(mantenerMensajes = false): void {
    this.cargando = true;

    if (!mantenerMensajes) {
      this.mensajeError = '';
      this.mensajeOk = '';
    }

    this.cdRef.detectChanges();

    this.tipoPagoService.listar({
      pagina: 1,
      registrosPorPagina: 1000
    }).pipe(take(1)).subscribe({
      next: (response) => {
        this.tiposPago = Array.isArray(response?.datos) ? response.datos : [];
        this.paginaActual = 1;
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.tiposPago = [];
        this.paginaActual = 1;
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'No se pudieron cargar los tipos de pago.');
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

  obtenerCodigo(x: TipoPagoVM): string {
    return String(x?.tpaId ?? '');
  }

  obtenerNombre(x: TipoPagoVM): string {
    return String(x?.tpaNombre ?? '').trim() || '(sin nombre)';
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

  nuevoTipoPago(): void {
    if (!this.esAdminUI()) return;
    this.router.navigate(['/panel/tipo-pago-crear']);
  }

  modificarTipoPago(x: TipoPagoVM): void {
    if (!this.esAdminUI()) return;

    this.editTipoPago = x;
    this.editNombre = String(x?.tpaNombre ?? '').trim();
    this.editError = '';
    this.editCargando = false;
    this.modalEditarVisible = true;
    this.cdRef.detectChanges();
  }

  cerrarModalEditar(): void {
    if (this.editCargando) return;

    this.modalEditarVisible = false;
    this.editTipoPago = null;
    this.editNombre = '';
    this.editError = '';
    this.cdRef.detectChanges();
  }

  guardarEdicion(): void {
    if (this.editCargando) return;
    if (!this.esAdminUI()) return;

    if (!this.editTipoPago) {
      this.editError = 'No hay tipo de pago seleccionado.';
      this.cdRef.detectChanges();
      return;
    }

    const nombre = (this.editNombre ?? '').trim();
    if (!nombre) {
      this.editError = 'El nombre del tipo de pago es obligatorio.';
      this.cdRef.detectChanges();
      return;
    }

    this.editError = '';
    this.editCargando = true;
    this.cdRef.detectChanges();

    const dto: TipoPagoEditarDto = {
      tpaNombre: nombre
    };

    this.tipoPagoService.editar(Number(this.editTipoPago.tpaId), dto).pipe(take(1)).subscribe({
      next: () => {
        const idx = this.tiposPago.findIndex(t => Number(t?.tpaId) === Number(this.editTipoPago?.tpaId));
        if (idx >= 0) {
          this.tiposPago[idx] = { ...this.tiposPago[idx], tpaNombre: dto.tpaNombre };
        }

        this.editCargando = false;
        this.modalEditarVisible = false;
        this.mensajeOk = 'Tipo de pago actualizado correctamente.';
        this.mensajeError = '';
        this.cdRef.detectChanges();

        this.abrirModalOkAuto('Tipo de pago actualizado correctamente.');
      },
      error: (err) => {
        if (err?.status === 200) {
          const idx = this.tiposPago.findIndex(t => Number(t?.tpaId) === Number(this.editTipoPago?.tpaId));
          if (idx >= 0) {
            this.tiposPago[idx] = { ...this.tiposPago[idx], tpaNombre: dto.tpaNombre };
          }

          this.editCargando = false;
          this.modalEditarVisible = false;
          this.mensajeOk = 'Tipo de pago actualizado correctamente.';
          this.mensajeError = '';
          this.cdRef.detectChanges();

          this.abrirModalOkAuto('Tipo de pago actualizado correctamente.');
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.editCargando = false;
        this.editError = this.extraerMensajeError(err, 'Error al actualizar el tipo de pago.');
        this.cdRef.detectChanges();
      }
    });
  }

  eliminarTipoPago(x: TipoPagoVM): void {
    if (!this.esAdminUI()) return;

    this.tipoPagoSeleccionado = x;
    this.confirmMensaje = `¿Seguro que deseas eliminar el tipo de pago "${this.obtenerNombre(x)}"?`;
    this.confirmVisible = true;
    this.cdRef.detectChanges();
  }

  cancelarConfirmacion(): void {
    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.tipoPagoSeleccionado = null;
    this.cdRef.detectChanges();
  }

  confirmarEliminacion(): void {
    const x = this.tipoPagoSeleccionado;

    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.tipoPagoSeleccionado = null;
    this.cdRef.detectChanges();

    if (!x) return;

    this.ejecutarEliminarTipoPago(x);
  }

  private ejecutarEliminarTipoPago(x: TipoPagoVM): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.tipoPagoService.eliminar(Number(x.tpaId)).pipe(take(1)).subscribe({
      next: () => {
        this.tiposPago = this.tiposPago.filter(t => Number(t.tpaId) !== Number(x.tpaId));
        this.ajustarPaginaDespuesDeCambios();
        this.cargando = false;
        this.mensajeOk = 'Tipo de pago eliminado correctamente.';
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.tiposPago = this.tiposPago.filter(t => Number(t.tpaId) !== Number(x.tpaId));
          this.ajustarPaginaDespuesDeCambios();
          this.cargando = false;
          this.mensajeOk = 'Tipo de pago eliminado correctamente.';
          this.cdRef.detectChanges();
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al eliminar el tipo de pago.');
        this.cdRef.detectChanges();
      },
    });
  }
}