import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ClienteService, ClienteListadoDto, ClienteEditarDto } from '../../../servicios/cliente.service';

type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

@Component({
  selector: 'app-cliente-modificar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-modificar.html',
  styleUrls: ['./cliente-modificar.css']
})
export class ClienteModificar implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);
  private okTimer: any = null;

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  modalOkVisible = false;
  modalOkMensaje = '';

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario!: RolApp;

  cliId = 0;
  cliente: ClienteListadoDto | null = null;

  ngOnInit(): void {
    const pm = this.route.snapshot.paramMap;
    const qm = this.route.snapshot.queryParamMap;

    const raw =
      pm.get('cliId') ??
      pm.get('id') ??
      qm.get('cliId') ??
      qm.get('id');

    const id = raw ? Number(raw) : NaN;

    if (!Number.isFinite(id) || id <= 0) {
      this.mensajeError = 'ID de cliente inválido.';
      return;
    }

    this.cliId = id;
    this.cargarTodo();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  private cargarTodo(): void {
    this.cargando = true;
    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    forkJoin({
      me: this.authService.me().pipe(take(1)),
      cliente: this.clienteService.obtenerPorId(this.cliId).pipe(take(1))
    }).subscribe({
      next: ({ me, cliente }) => {
        const usuario = me?.datos;
        const cli = cliente?.datos;

        if (!usuario || !this.esRolValido(usuario.usuRol)) {
          this.cargando = false;
          this.router.navigate(['/login']);
          return;
        }

        if (!cli) {
          this.cargando = false;
          this.mensajeError = 'No se encontró el cliente.';
          this.cdRef.detectChanges();
          return;
        }

        this.usuarioActual = usuario;
        this.rolUsuario = usuario.usuRol.toUpperCase() as RolApp;
        this.cliente = cli;

        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.cargando = false;

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.mensajeError = this.extraerMensajeError(err, 'Error al cargar el cliente.');
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

  private limpiarTelefono(tel: string): string {
    return (tel ?? '').replace(/\D/g, '').trim();
  }

  validarTelefonoEC(tel: string): boolean {
    const t = this.limpiarTelefono(tel);
    if (!t) return false;

    if (t.startsWith('09')) return t.length === 10;
    if (t.startsWith('02')) return t.length === 9;

    return false;
  }

  validarEmail(email: string): boolean {
    const e = (email ?? '').trim();
    if (!e) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  }

  guardarCambios(): void {
    if (!this.cliente) return;

    if (!this.esAdminUI()) {
      this.setError('Sin permisos: solo un administrador puede modificar clientes.');
      return;
    }

    this.mensajeError = '';
    this.mensajeOk = '';

    const nombre = String(this.cliente.cliNombre ?? '').trim();
    const apellido = String(this.cliente.cliApellido ?? '').trim();

    if (!nombre) return this.setError('El nombre es obligatorio.');
    if (!apellido) return this.setError('El apellido es obligatorio.');

    const cedulaRaw = String(this.cliente.cliCedula ?? '').trim();

    const correo = String(this.cliente.cliCorreo ?? '').trim();
    if (correo && !this.validarEmail(correo)) {
      return this.setError('El correo no es válido.');
    }

    const telRaw = String(this.cliente.cliTelefono ?? '').trim();
    const tel = this.limpiarTelefono(telRaw);
    if (telRaw && !this.validarTelefonoEC(tel)) {
      return this.setError('Teléfono inválido: debe iniciar con 09 (10 dígitos) o 02 (9 dígitos).');
    }

    const direccion = String(this.cliente.cliDireccion ?? '').trim();

    const dto: ClienteEditarDto = {
      cliCedula: cedulaRaw || null,
      cliNombre: nombre,
      cliApellido: apellido,
      cliDireccion: direccion || null,
      cliCorreo: correo || null,
      cliTelefono: telRaw ? tel : null
    };

    this.cargando = true;
    this.cdRef.detectChanges();

    this.clienteService.editar(this.cliId, dto).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeOk = 'Cliente actualizado correctamente.';
        this.cdRef.detectChanges();
        this.abrirModalOk('Cliente actualizado correctamente.');
      },
      error: (err) => {
        if (err?.status === 200) {
          this.cargando = false;
          this.mensajeOk = 'Cliente actualizado correctamente.';
          this.cdRef.detectChanges();
          this.abrirModalOk('Cliente actualizado correctamente.');
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al actualizar el cliente.');
        this.cdRef.detectChanges();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/panel/cliente-lista']);
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

  private abrirModalOk(msg: string): void {
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
      this.router.navigate(['/panel/cliente-lista']);
    }, 2000);
  }
}