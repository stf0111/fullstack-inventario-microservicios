import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ClienteService, ClienteListadoDto } from '../../../servicios/cliente.service';

type ClienteVM = ClienteListadoDto;
type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

@Component({
  selector: 'app-cliente-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-lista.html',
  styleUrls: ['./cliente-lista.css'],
})
export class ClienteLista implements OnInit {
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  // Sesión + rol
  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  // Data
  clientes: ClienteVM[] = [];

  // Filtros
  terminoBusqueda = '';

  // Estado UI
  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  // Paginación
  paginaActual = 1;
  tamanoPagina = 15;

  // Confirmación eliminar
  confirmVisible = false;
  confirmMensaje = '';
  confirmCliente: ClienteVM | null = null;

  // -------------------------
  // GETTERS
  // -------------------------
  get clientesFiltrados(): ClienteVM[] {
    let lista = [...this.clientes];

    const t = this.terminoBusqueda.trim().toLowerCase();
    if (t) {
      lista = lista.filter((c) => {
        const cod = this.obtenerCodigo(c).toLowerCase();
        const ced = this.obtenerCedula(c).toLowerCase();
        const nom = this.obtenerNombre(c).toLowerCase();
        const correo = this.obtenerCorreo(c).toLowerCase();
        const tel = this.obtenerTelefono(c).toLowerCase();
        const dir = this.obtenerDireccion(c).toLowerCase();

        return (
          cod.includes(t) ||
          ced.includes(t) ||
          nom.includes(t) ||
          correo.includes(t) ||
          tel.includes(t) ||
          dir.includes(t)
        );
      });
    }

    return lista;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.clientesFiltrados.length / this.tamanoPagina));
  }

  get clientesPaginaActual(): ClienteVM[] {
    const datos = this.clientesFiltrados;
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return datos.slice(inicio, inicio + this.tamanoPagina);
  }

  // -------------------------
  // INIT
  // -------------------------
  ngOnInit(): void {
    this.cargarSesionYClientes();
  }

  private cargarSesionYClientes(): void {
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

        this.cargarClientes();
      },
      error: () => {
        this.cargando = false;
        this.router.navigate(['/login']);
      },
    });
  }

  private cargarClientes(mantenerMensajes = false): void {
    this.cargando = true;

    if (!mantenerMensajes) {
      this.mensajeError = '';
      this.mensajeOk = '';
    }

    this.cdRef.detectChanges();

    this.clienteService.listar({
      pagina: 1,
      registrosPorPagina: 1000
    }).pipe(take(1)).subscribe({
      next: (response) => {
        this.clientes = Array.isArray(response?.datos) ? response.datos : [];
        this.paginaActual = 1;
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.clientes = [];
        this.paginaActual = 1;
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'No se pudieron cargar los clientes.');
        this.cdRef.detectChanges();
      },
    });
  }

  // -------------------------
  // FILTROS / PAGINACIÓN
  // -------------------------
  aplicarFiltros(): void {
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.paginaActual = 1;
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.paginaActual--;
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.paginaActual++;
    }
  }

  private ajustarPaginaDespuesDeCambios(): void {
    const total = this.totalPaginas;
    if (this.paginaActual > total) {
      this.paginaActual = total;
    }
    if (this.paginaActual < 1) {
      this.paginaActual = 1;
    }
  }

  // -------------------------
  // ROLES / PERMISOS
  // -------------------------
  private esRolValido(rol: string | null | undefined): rol is RolApp {
    const r = String(rol ?? '').trim().toUpperCase();
    return r === 'ADMIN' || r === 'OPERADOR' || r === 'VENDEDOR';
  }

  esAdminUI(): boolean {
    return this.rolUsuario === 'ADMIN';
  }

  // -------------------------
  // HELPERS CAMPOS
  // -------------------------
  obtenerCodigo(c: ClienteVM): string {
    return String(c?.cliId ?? '');
  }

  obtenerCedula(c: ClienteVM): string {
    return String(c?.cliCedula ?? '');
  }

  obtenerNombre(c: ClienteVM): string {
    const nombre = c?.cliNombre ?? '';
    const apellido = c?.cliApellido ?? '';
    const full = `${nombre} ${apellido}`.trim();
    return full || '(sin nombre)';
  }

  obtenerCorreo(c: ClienteVM): string {
    return String(c?.cliCorreo ?? '');
  }

  obtenerTelefono(c: ClienteVM): string {
    return String(c?.cliTelefono ?? '');
  }

  obtenerDireccion(c: ClienteVM): string {
    return String(c?.cliDireccion ?? '');
  }

  // -------------------------
  // MENSAJES
  // -------------------------
  private extraerMensajeError(err: any, porDefecto: string): string {
    if (!err) return porDefecto;

    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error && typeof err.error === 'object') {
      if (typeof err.error.mensaje === 'string' && err.error.mensaje.trim()) {
        return err.error.mensaje;
      }
      if (typeof err.error.message === 'string' && err.error.message.trim()) {
        return err.error.message;
      }
      if (typeof err.error.title === 'string' && err.error.title.trim()) {
        return err.error.title;
      }
      if (typeof err.error.detail === 'string' && err.error.detail.trim()) {
        return err.error.detail;
      }
    }

    if (typeof err.message === 'string' && err.message.trim()) {
      return err.message;
    }

    return porDefecto;
  }

  // -------------------------
  // ACCIONES
  // -------------------------
  nuevoCliente(): void {
    if (!this.esAdminUI()) return;
    this.router.navigate(['/panel/cliente-crear']);
  }

  modificarCliente(c: ClienteVM): void {
    if (!this.esAdminUI()) return;

    const id = Number(c?.cliId);
    if (!Number.isFinite(id)) return;

    this.router.navigate(['/panel/cliente-modificar', id]);
  }

  eliminarCliente(c: ClienteVM): void {
    if (!this.esAdminUI()) return;

    this.confirmCliente = c;
    this.confirmMensaje = `¿Seguro que deseas eliminar al cliente "${this.obtenerNombre(c)}"?`;
    this.confirmVisible = true;
    this.cdRef.detectChanges();
  }

  cancelarConfirmacion(): void {
    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.confirmCliente = null;
    this.cdRef.detectChanges();
  }

  confirmarEliminacion(): void {
    const c = this.confirmCliente;

    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.confirmCliente = null;

    if (!c) return;

    const id = Number(c.cliId);
    if (!Number.isFinite(id)) return;

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.clienteService.eliminar(id).pipe(take(1)).subscribe({
      next: () => {
        this.clientes = this.clientes.filter(x => Number(x.cliId) !== id);
        this.ajustarPaginaDespuesDeCambios();

        this.cargando = false;
        this.mensajeOk = 'Cliente eliminado correctamente.';
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(
          err,
          'No se pudo eliminar el cliente. Si tiene facturas asociadas, debe manejarse con baja lógica en el backend.'
        );
        this.cdRef.detectChanges();
      }
    });
  }
}