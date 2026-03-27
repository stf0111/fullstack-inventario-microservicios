import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ProveedorService, ProveedorListadoDto } from '../../../servicios/proveedor.service';

type ProveedorVM = ProveedorListadoDto;
type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

@Component({
  selector: 'app-proveedor-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedor-lista.html',
  styleUrls: ['./proveedor-lista.css'],
})
export class ProveedorLista implements OnInit {
  private authService = inject(AuthService);
  private proveedorService = inject(ProveedorService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  proveedores: ProveedorVM[] = [];

  terminoBusqueda = '';

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  paginaActual = 1;
  tamanoPagina = 15;

  confirmVisible = false;
  confirmMensaje = '';
  confirmTitulo = 'Eliminar proveedor';
  proveedorSeleccionado: ProveedorVM | null = null;

  get proveedoresFiltrados(): ProveedorVM[] {
    let lista = [...this.proveedores];

    const t = this.terminoBusqueda.trim().toLowerCase();
    if (t) {
      lista = lista.filter((p) => {
        const cod = this.obtenerCodigo(p).toLowerCase();
        const nom = this.obtenerNombre(p).toLowerCase();
        const ruc = this.obtenerRuc(p).toLowerCase();
        const tel = this.obtenerTelefono(p).toLowerCase();
        const correo = this.obtenerCorreo(p).toLowerCase();

        return (
          cod.includes(t) ||
          nom.includes(t) ||
          ruc.includes(t) ||
          tel.includes(t) ||
          correo.includes(t)
        );
      });
    }

    return lista;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.proveedoresFiltrados.length / this.tamanoPagina));
  }

  get proveedoresPaginaActual(): ProveedorVM[] {
    const datos = this.proveedoresFiltrados;
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return datos.slice(inicio, inicio + this.tamanoPagina);
  }

  ngOnInit(): void {
    this.cargarSesionYProveedores();
  }

  private cargarSesionYProveedores(): void {
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

        this.cargarProveedores();
      },
      error: () => {
        this.cargando = false;
        this.router.navigate(['/login']);
      },
    });
  }

  private cargarProveedores(mantenerMensajes = false): void {
    this.cargando = true;

    if (!mantenerMensajes) {
      this.mensajeError = '';
      this.mensajeOk = '';
    }

    this.cdRef.detectChanges();

    this.proveedorService.listar({
      pagina: 1,
      registrosPorPagina: 1000
    }).pipe(take(1)).subscribe({
      next: (response) => {
        this.proveedores = Array.isArray(response?.datos) ? response.datos : [];
        this.paginaActual = 1;
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.proveedores = [];
        this.paginaActual = 1;
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'No se pudieron cargar los proveedores.');
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

  obtenerCodigo(p: ProveedorVM): string {
    return String(p?.provId ?? '');
  }

  obtenerNombre(p: ProveedorVM): string {
    return String(p?.provNombre ?? '').trim() || '(sin nombre)';
  }

  obtenerRuc(p: ProveedorVM): string {
    return String(p?.provRuc ?? '');
  }

  obtenerTelefono(p: ProveedorVM): string {
    return String(p?.provTelefono ?? '');
  }

  obtenerCorreo(p: ProveedorVM): string {
    return String(p?.provCorreo ?? '');
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

  private ajustarPaginaDespuesDeCambios(): void {
    const total = this.totalPaginas;
    if (this.paginaActual > total) this.paginaActual = total;
    if (this.paginaActual < 1) this.paginaActual = 1;
  }

  nuevoProveedor(): void {
    if (!this.esAdminUI()) return;
    this.router.navigate(['/panel/proveedor-crear']);
  }

  modificarProveedor(p: ProveedorVM): void {
    if (!this.esAdminUI()) return;

    const id = Number(p?.provId);
    if (!Number.isFinite(id)) return;

    this.router.navigate(['/panel/proveedor-modificar', id]);
  }

  eliminarProveedor(p: ProveedorVM): void {
    if (!this.esAdminUI()) return;

    this.proveedorSeleccionado = p;
    this.confirmMensaje = `¿Seguro que deseas eliminar al proveedor "${this.obtenerNombre(p)}"?`;
    this.confirmVisible = true;
    this.cdRef.detectChanges();
  }

  cancelarConfirmacion(): void {
    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.proveedorSeleccionado = null;
    this.cdRef.detectChanges();
  }

  confirmarEliminacion(): void {
    const p = this.proveedorSeleccionado;

    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.proveedorSeleccionado = null;
    this.cdRef.detectChanges();

    if (!p) return;

    this.ejecutarEliminarProveedor(p);
  }

  private ejecutarEliminarProveedor(p: ProveedorVM): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.proveedorService.eliminar(p.provId).pipe(take(1)).subscribe({
      next: () => {
        this.proveedores = this.proveedores.filter(x => Number(x.provId) !== Number(p.provId));
        this.ajustarPaginaDespuesDeCambios();
        this.cargando = false;
        this.mensajeOk = 'Proveedor eliminado correctamente.';
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.proveedores = this.proveedores.filter(x => Number(x.provId) !== Number(p.provId));
          this.ajustarPaginaDespuesDeCambios();
          this.cargando = false;
          this.mensajeOk = 'Proveedor eliminado correctamente.';
          this.cdRef.detectChanges();
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al eliminar el proveedor.');
        this.cdRef.detectChanges();
      },
    });
  }
}