import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import {
  ClienteService,
  ClienteCrearDto,
  ClienteListadoDto
} from '../../../servicios/cliente.service';

@Component({
  selector: 'app-factura-cliente-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './factura-cliente-crear.html',
  styleUrls: ['./factura-cliente-crear.css'],
})
export class FacturaClienteCrear implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private clienteService = inject(ClienteService);
  private cdRef = inject(ChangeDetectorRef);
  private router = inject(Router);

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario = '';

  cliente: ClienteCrearDto = {
    cliCedula: '',
    cliNombre: '',
    cliApellido: '',
    cliDireccion: '',
    cliCorreo: '',
    cliTelefono: '',
  };

  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: any = null;

  ngOnInit(): void {
    this.cargarSesion();
  }

  ngOnDestroy(): void {
    if (this.okTimer) {
      clearTimeout(this.okTimer);
      this.okTimer = null;
    }
  }

  private cargarSesion(): void {
    this.authService.me().pipe(take(1)).subscribe({
      next: (response) => {
        const me = response?.datos ?? null;

        if (!me) {
          this.router.navigate(['/login']);
          return;
        }

        this.usuarioActual = me;
        this.rolUsuario = String(me.usuRol ?? 'Usuario');
        this.cdRef.detectChanges();
      },
      error: () => this.router.navigate(['/login']),
    });
  }

  private esAdmin(rol: string): boolean {
    const r = (rol ?? '').trim().toLowerCase();
    return r === 'adm' || r.startsWith('admin') || r.includes('administrador');
  }

  esAdminUI(): boolean {
    return this.esAdmin(this.usuarioActual?.usuRol ?? '');
  }

  volver(): void {
    this.router.navigate(['/panel/factura-registrar']);
  }

  private limpiarCedula(cedula: string): string {
    return (cedula ?? '').replace(/\D/g, '').trim();
  }

  validarCedulaEC(cedula: string): boolean {
    const c = this.limpiarCedula(cedula);

    if (c.length !== 10) return false;
    if (c === '9999999999') return true;

    const provincia = parseInt(c.substring(0, 2), 10);
    if (!((provincia > 0 && provincia <= 24) || provincia === 30)) return false;

    const digitos = c.split('').map(Number);
    const digitoVerificador = digitos[9];

    let sumaPares = 0;
    let sumaImpares = 0;

    for (let i = 0; i < 9; i += 2) {
      let valor = digitos[i] * 2;
      if (valor > 9) valor -= 9;
      sumaImpares += valor;
    }

    for (let i = 1; i < 8; i += 2) {
      sumaPares += digitos[i];
    }

    const total = sumaPares + sumaImpares;
    const decenaSuperior = Math.ceil(total / 10) * 10;
    const calculado = decenaSuperior - total;

    return calculado === digitoVerificador || (calculado === 10 && digitoVerificador === 0);
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

  private abrirModalOkAuto(msg: string, clienteCreado?: ClienteListadoDto): void {
    this.modalOkMensaje = msg;
    this.modalOkVisible = true;
    this.cdRef.detectChanges();

    if (this.okTimer) clearTimeout(this.okTimer);

    this.okTimer = setTimeout(() => {
      this.modalOkVisible = false;
      this.modalOkMensaje = '';
      this.cdRef.detectChanges();

      this.router.navigate(['/panel/factura-registrar'], {
        state: { clienteCreado },
      });
    }, 2000);
  }

  guardarCliente(): void {
    if (this.cargando) return;

    if (!this.esAdminUI()) {
      this.setError('Sin permisos: solo un administrador puede crear clientes.');
      return;
    }

    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    const nombre = (this.cliente.cliNombre ?? '').trim();
    const apellido = (this.cliente.cliApellido ?? '').trim();

    if (!nombre) return this.setError('El nombre es obligatorio.');
    if (!apellido) return this.setError('El apellido es obligatorio.');

    const cedulaRaw = (this.cliente.cliCedula ?? '').trim();
    const cedula = this.limpiarCedula(cedulaRaw);
    if (cedulaRaw && !this.validarCedulaEC(cedula)) {
      return this.setError('La cédula ecuatoriana no es válida.');
    }

    const correo = (this.cliente.cliCorreo ?? '').trim();
    if (correo && !this.validarEmail(correo)) {
      return this.setError('El correo no es válido.');
    }

    const telRaw = (this.cliente.cliTelefono ?? '').trim();
    const tel = this.limpiarTelefono(telRaw);
    if (telRaw && !this.validarTelefonoEC(tel)) {
      return this.setError('Teléfono inválido: debe iniciar con 09 (10 dígitos) o 02 (9 dígitos).');
    }

    const direccion = (this.cliente.cliDireccion ?? '').trim();

    const dto: ClienteCrearDto = {
      cliCedula: cedulaRaw ? cedula : null,
      cliNombre: nombre,
      cliApellido: apellido,
      cliDireccion: direccion ? direccion : null,
      cliCorreo: correo ? correo : null,
      cliTelefono: telRaw ? tel : null,
    };

    this.cargando = true;
    this.cdRef.detectChanges();

    this.clienteService.crear(dto).pipe(take(1)).subscribe({
      next: (response) => {
        this.cargando = false;
        this.mensajeOk = 'Cliente creado correctamente.';
        this.cdRef.detectChanges();

        const data = response?.datos ?? null;

        const clienteCreado: ClienteListadoDto = {
          cliId: Number(data?.cliId ?? 0),
          cliCedula: data?.cliCedula ?? dto.cliCedula ?? null,
          cliNombre: data?.cliNombre ?? dto.cliNombre,
          cliApellido: data?.cliApellido ?? dto.cliApellido,
          cliNombreCompleto:
            data?.cliNombreCompleto ??
            `${data?.cliNombre ?? dto.cliNombre} ${data?.cliApellido ?? dto.cliApellido}`.trim(),
          cliDireccion: data?.cliDireccion ?? dto.cliDireccion ?? null,
          cliCorreo: data?.cliCorreo ?? dto.cliCorreo ?? null,
          cliTelefono: data?.cliTelefono ?? dto.cliTelefono ?? null,
          createdAt: data?.createdAt ?? '',
          updatedAt: data?.updatedAt ?? null,
        };

        this.cliente = {
          cliCedula: '',
          cliNombre: '',
          cliApellido: '',
          cliDireccion: '',
          cliCorreo: '',
          cliTelefono: '',
        };

        this.abrirModalOkAuto('Cliente creado correctamente.', clienteCreado);
      },
      error: (err: any) => {
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al crear el cliente.');
        this.cdRef.detectChanges();
      },
    });
  }
}