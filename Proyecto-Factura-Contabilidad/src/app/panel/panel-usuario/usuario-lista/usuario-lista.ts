import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { UsuarioService, UsuarioListadoDto } from '../../../servicios/usuario.service';

type EstadoFiltro = 'ACTIVOS' | 'INACTIVOS' | 'TODOS';
type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

@Component({
  selector: 'app-usuario-lista',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuario-lista.html',
  styleUrls: ['./usuario-lista.css'],
})
export class UsuarioLista implements OnInit {
  private authService = inject(AuthService);
  private usuarioService = inject(UsuarioService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  // Usuario actual
  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  // Data
  usuarios: UsuarioListadoDto[] = [];

  // Filtros
  terminoBusqueda = '';
  filtroEstado: EstadoFiltro = 'ACTIVOS';

  // Estado UI
  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  // Paginación
  paginaActual = 1;
  tamanoPagina = 15;

  // Modales
  modalPasswordVisible = false;
  passwordGenerada: string | null = null;
  usuarioSeleccionado: UsuarioListadoDto | null = null;

  confirmVisible = false;
  confirmMensaje = '';
  confirmTipo: 'estado' | 'password' | 'delete' | null = null;
  confirmUsuario: UsuarioListadoDto | null = null;

  // -------------------------
  // GETTERS
  // -------------------------
  get usuariosFiltrados(): UsuarioListadoDto[] {
    let lista = [...this.usuarios];

    const t = this.terminoBusqueda.trim().toLowerCase();
    if (t) {
      lista = lista.filter((u) => {
        const cod = this.obtenerCodigo(u).toLowerCase();
        const ced = this.obtenerCedula(u).toLowerCase();
        const nom = this.obtenerNombre(u).toLowerCase();
        const rol = this.obtenerRolTexto(u).toLowerCase();

        return cod.includes(t) || ced.includes(t) || nom.includes(t) || rol.includes(t);
      });
    }

    if (this.filtroEstado === 'ACTIVOS') {
      lista = lista.filter((u) => this.esActivo(u));
    }

    if (this.filtroEstado === 'INACTIVOS') {
      lista = lista.filter((u) => !this.esActivo(u));
    }

    return lista;
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.usuariosFiltrados.length / this.tamanoPagina));
  }

  get usuariosPaginaActual(): UsuarioListadoDto[] {
    const datos = this.usuariosFiltrados;
    const inicio = (this.paginaActual - 1) * this.tamanoPagina;
    return datos.slice(inicio, inicio + this.tamanoPagina);
  }

  get confirmTitulo(): string {
    if (this.confirmTipo === 'delete') return 'Eliminar usuario';
    if (this.confirmTipo === 'password') return 'Generar contraseña';
    if (this.confirmTipo === 'estado') return 'Cambiar estado';
    return 'Confirmar acción';
  }

  // -------------------------
  // INIT
  // -------------------------
  ngOnInit(): void {
    this.cargarSesionYUsuarios();
  }

  private cargarSesionYUsuarios(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.authService.me().subscribe({
      next: (response) => {
        const me = response?.datos;

        if (!me || !this.esRolValido(me.usuRol)) {
          this.cargando = false;
          this.router.navigate(['/login']);
          return;
        }

        this.usuarioActual = me;
        this.rolUsuario = me.usuRol.toUpperCase() as RolApp;

        this.cargarUsuarios();
      },
      error: () => {
        this.cargando = false;
        this.router.navigate(['/login']);
      },
    });
  }

  // -------------------------
  // CARGAR USUARIOS
  // -------------------------
  private cargarUsuarios(mantenerMensajes = false): void {
    this.cargando = true;

    if (!mantenerMensajes) {
      this.mensajeError = '';
      this.mensajeOk = '';
    }

    this.cdRef.detectChanges();

    this.usuarioService.listar({
      pagina: 1,
      registrosPorPagina: 1000
    }).subscribe({
      next: (response) => {
        const lista = Array.isArray(response?.datos) ? response.datos : [];
        const miUsuId = Number(this.usuarioActual?.usuId ?? 0);
        this.usuarios = lista.filter(u => Number(u?.usuId) !== miUsuId);
        this.paginaActual = 1;
        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.usuarios = [];
        this.paginaActual = 1;
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'No se pudieron cargar los usuarios.');
        this.cdRef.detectChanges();
      },
    });
  }

  // -------------------------
  // FILTROS
  // -------------------------
  aplicarFiltros(): void {
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroEstado = 'ACTIVOS';
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

  puedeVerAcciones(): boolean {
    return this.esAdminUI();
  }

  private formatearRolNombre(rol: string): string {
    const r = String(rol ?? '').trim().toUpperCase();

    if (r === 'ADMIN') return 'Administrador';
    if (r === 'OPERADOR') return 'Operador';
    if (r === 'VENDEDOR') return 'Vendedor';

    return r || 'Sin rol';
  }

  // -------------------------
  // HELPERS CAMPOS
  // -------------------------
  obtenerCodigo(u: UsuarioListadoDto): string {
    return String(u?.usuId ?? '');
  }

  obtenerCedula(u: UsuarioListadoDto): string {
    return String(u?.usuCedula ?? '');
  }

  obtenerNombre(u: UsuarioListadoDto): string {
    const full = String(u?.usuNombreCompleto ?? '').trim();
    if (full) return full;

    const nombre = String(u?.usuNombre ?? '').trim();
    const apellido = String(u?.usuApellido ?? '').trim();
    return `${nombre} ${apellido}`.trim() || '(sin nombre)';
  }

  obtenerRolTexto(u: UsuarioListadoDto): string {
    return this.formatearRolNombre(u?.usuRol ?? '');
  }

  esActivo(u: UsuarioListadoDto): boolean {
    return u?.usuEstado === true;
  }

  obtenerTextoEstado(u: UsuarioListadoDto): string {
    return this.esActivo(u) ? 'Activo' : 'Inactivo';
  }

  obtenerClasesEstado(u: UsuarioListadoDto): string {
    return this.esActivo(u)
      ? 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-600'
      : 'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-rose-50 text-rose-600';
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
  // ACCIONES
  // -------------------------
  nuevoUsuario(): void {
    if (!this.esAdminUI()) return;
    this.router.navigate(['/panel/usuario-crear']);
  }

  modificarUsuario(u: UsuarioListadoDto): void {
    if (!this.esAdminUI()) return;

    const id = Number(u?.usuId);
    if (!Number.isFinite(id)) return;

    this.router.navigate(['/panel/usuario-modificar', id]);
  }

  eliminarUsuario(u: UsuarioListadoDto): void {
    if (!this.esAdminUI()) return;

    const mensaje = `¿Seguro que deseas eliminar al usuario "${this.obtenerNombre(u)}"?`;
    this.abrirConfirmacion('delete', u, mensaje);
  }

  cambiarEstadoUsuario(u: UsuarioListadoDto): void {
    if (!this.esAdminUI()) return;

    const activo = this.esActivo(u);
    const accion = activo ? 'inhabilitar' : 'habilitar';
    const mensaje = `¿Seguro que deseas ${accion} al usuario "${this.obtenerNombre(u)}"?`;

    this.abrirConfirmacion('estado', u, mensaje);
  }

  generarContrasena(u: UsuarioListadoDto): void {
    if (!this.esAdminUI()) return;

    const mensaje =
      `Se generará una contraseña temporal para "${this.obtenerNombre(u)}" y se reemplazará la actual. ¿Deseas continuar?`;

    this.abrirConfirmacion('password', u, mensaje);
  }

  // -------------------------
  // CONFIRMACIÓN
  // -------------------------
  private abrirConfirmacion(
    tipo: 'estado' | 'password' | 'delete',
    usuario: UsuarioListadoDto,
    mensaje: string
  ): void {
    this.confirmTipo = tipo;
    this.confirmUsuario = usuario;
    this.confirmMensaje = mensaje;
    this.confirmVisible = true;
    this.cdRef.detectChanges();
  }

  cancelarConfirmacion(): void {
    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.confirmUsuario = null;
    this.confirmTipo = null;
    this.cdRef.detectChanges();
  }

  confirmarAccion(): void {
    const u = this.confirmUsuario;
    const tipo = this.confirmTipo;

    this.confirmVisible = false;
    this.confirmMensaje = '';
    this.confirmUsuario = null;
    this.confirmTipo = null;
    this.cdRef.detectChanges();

    if (!u || !tipo) return;

    if (tipo === 'estado') this.ejecutarCambioEstado(u);
    if (tipo === 'password') this.ejecutarGenerarContrasena(u);
    if (tipo === 'delete') this.ejecutarEliminarUsuario(u);
  }

  // -------------------------
  // ESTADO
  // -------------------------
  private ejecutarCambioEstado(u: UsuarioListadoDto): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.usuarioService.editar(u.usuId, {
      usuCedula: u.usuCedula,
      usuNombre: u.usuNombre,
      usuApellido: u.usuApellido,
      usuRol: u.usuRol,
      usuEstado: !this.esActivo(u)
    }).subscribe({
      next: () => {
        this.mensajeOk = !this.esActivo(u)
          ? 'Usuario habilitado correctamente.'
          : 'Usuario inhabilitado correctamente.';

        this.cargarUsuarios(true);
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.mensajeOk = !this.esActivo(u)
            ? 'Usuario habilitado correctamente.'
            : 'Usuario inhabilitado correctamente.';

          this.cargarUsuarios(true);
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al actualizar el estado del usuario.');
        this.cdRef.detectChanges();
      },
    });
  }

  // -------------------------
  // PASSWORD TEMPORAL
  // -------------------------
  private ejecutarGenerarContrasena(u: UsuarioListadoDto): void {
    const nuevaPass = this.generarPasswordTemporal();

    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    const onSuccess = () => {
      this.cargando = false;
      this.mensajeOk = 'Contraseña temporal generada correctamente.';
      this.passwordGenerada = nuevaPass;
      this.usuarioSeleccionado = u;
      this.modalPasswordVisible = true;
      this.cdRef.detectChanges();
      this.cargarUsuarios(true);
    };

    this.usuarioService.editar(u.usuId, {
      usuCedula: u.usuCedula,
      usuNombre: u.usuNombre,
      usuApellido: u.usuApellido,
      usuRol: u.usuRol,
      usuEstado: u.usuEstado,
      password: nuevaPass
    }).subscribe({
      next: () => onSuccess(),
      error: (err: any) => {
        if (err?.status === 200) {
          onSuccess();
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al generar la contraseña temporal.');
        this.cdRef.detectChanges();
      },
    });
  }

  private generarPasswordTemporal(): string {
    const prefix = 'CTmp_A';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';

    for (let i = 0; i < 5; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return prefix + suffix;
  }

  cerrarModalPassword(): void {
    this.modalPasswordVisible = false;
    this.passwordGenerada = null;
    this.usuarioSeleccionado = null;
    this.cdRef.detectChanges();
  }

  // -------------------------
  // ELIMINAR
  // -------------------------
  private ejecutarEliminarUsuario(u: UsuarioListadoDto): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    this.usuarioService.eliminar(u.usuId).subscribe({
      next: () => {
        this.usuarios = this.usuarios.filter(x => Number(x.usuId) !== Number(u.usuId));
        this.ajustarPaginaDespuesDeCambios();
        this.cargando = false;
        this.mensajeOk = 'Usuario eliminado correctamente.';
        this.cdRef.detectChanges();
      },
      error: (err: any) => {
        if (err?.status === 200) {
          this.usuarios = this.usuarios.filter(x => Number(x.usuId) !== Number(u.usuId));
          this.ajustarPaginaDespuesDeCambios();
          this.cargando = false;
          this.mensajeOk = 'Usuario eliminado correctamente.';
          this.cdRef.detectChanges();
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al eliminar el usuario.');
        this.cdRef.detectChanges();
      },
    });
  }
}