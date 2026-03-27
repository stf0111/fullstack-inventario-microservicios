import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ProveedorService, ProveedorListadoDto, ProveedorEditarDto } from '../../../servicios/proveedor.service';

type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR';

type ProveedorVM = ProveedorListadoDto & {
  provDireccion?: string | null;
};

@Component({
  selector: 'app-proveedor-modificar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedor-modificar.html',
  styleUrls: ['./proveedor-modificar.css']
})
export class ProveedorModificar implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private proveedorService = inject(ProveedorService);
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

  provId = 0;
  proveedor: ProveedorVM | null = null;

  ngOnInit(): void {
    const pm = this.route.snapshot.paramMap;
    const qm = this.route.snapshot.queryParamMap;

    const raw =
      pm.get('provId') ??
      pm.get('id') ??
      qm.get('provId') ??
      qm.get('id');

    const id = raw != null ? Number(raw) : NaN;

    if (!Number.isFinite(id) || id <= 0) {
      this.mensajeError = 'ID de proveedor inválido.';
      return;
    }

    this.provId = id;
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
      prov: this.proveedorService.obtenerPorId(this.provId).pipe(take(1))
    }).subscribe({
      next: ({ me, prov }) => {
        const usuario = me?.datos;
        const proveedor = prov?.datos;

        if (!usuario || !this.esRolValido(usuario.usuRol)) {
          this.cargando = false;
          this.router.navigate(['/login']);
          return;
        }

        this.usuarioActual = usuario;
        this.rolUsuario = usuario.usuRol.toUpperCase() as RolApp;

        if (!proveedor) {
          this.cargando = false;
          this.mensajeError = 'No se pudo cargar el proveedor.';
          this.cdRef.detectChanges();
          return;
        }

        this.proveedor = {
          ...proveedor,
          provDireccion: proveedor.provDireccion ?? null
        };

        this.cargando = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        this.cargando = false;

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.mensajeError = this.extraerMensajeError(err, 'Error al cargar el proveedor.');
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

  private soloDigitos(v: string): string {
    return (v ?? '').replace(/\D/g, '').trim();
  }

  validarEmail(email: string): boolean {
    const e = (email ?? '').trim();
    if (!e) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  }

  validarTelefonoEC(tel: string): boolean {
    const t = this.soloDigitos(tel);
    if (!t) return false;
    if (t.startsWith('09')) return t.length === 10;
    if (t.startsWith('02')) return t.length === 9;
    return false;
  }

  private validarCedulaModulo10(cedula10: string): boolean {
    if (!/^\d{10}$/.test(cedula10)) return false;

    const provincia = parseInt(cedula10.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;

    const digitos = cedula10.split('').map(Number);
    const dv = digitos[9];

    const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let total = 0;

    for (let i = 0; i < 9; i++) {
      let val = digitos[i] * coef[i];
      if (val > 9) val -= 9;
      total += val;
    }

    const res = total % 10 === 0 ? 0 : 10 - (total % 10);
    return res === dv;
  }

  private validarModulo11(numero: string, coef: number[], posDV: number): boolean {
    const digitos = numero.split('').map(n => Number(n));
    const dv = digitos[posDV];

    let suma = 0;
    for (let i = 0; i < coef.length; i++) {
      suma += digitos[i] * coef[i];
    }

    const mod = suma % 11;
    let res = 11 - mod;

    if (res === 11) res = 0;
    if (res === 10) return false;

    return res === dv;
  }

  validarRucEC(ruc: string): boolean {
    const r = this.soloDigitos(ruc);
    if (!/^\d{13}$/.test(r)) return false;

    const provincia = parseInt(r.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;

    const tercer = parseInt(r.substring(2, 3), 10);

    if (tercer >= 0 && tercer <= 5) {
      const establecimiento = r.substring(10, 13);
      if (establecimiento === '000') return false;
      return this.validarCedulaModulo10(r.substring(0, 10));
    }

    if (tercer === 6) {
      const establecimiento4 = r.substring(9, 13);
      if (establecimiento4 === '0000') return false;

      const coefPublica = [3, 2, 7, 6, 5, 4, 3, 2];
      return this.validarModulo11(r, coefPublica, 8);
    }

    if (tercer === 9) {
      const establecimiento = r.substring(10, 13);
      if (establecimiento === '000') return false;

      const coefPrivada = [4, 3, 2, 7, 6, 5, 4, 3, 2];
      return this.validarModulo11(r, coefPrivada, 9);
    }

    return false;
  }

  guardarCambios(): void {
    if (!this.proveedor) return;

    if (!this.esAdminUI()) {
      this.setError('Sin permisos: solo un administrador puede modificar proveedores.');
      return;
    }

    this.mensajeError = '';
    this.mensajeOk = '';

    const nombre = (this.proveedor.provNombre ?? '').trim();
    if (!nombre) {
      return this.setError('El nombre es obligatorio.');
    }

    const correo = String(this.proveedor.provCorreo ?? '').trim();
    if (correo && !this.validarEmail(correo)) {
      return this.setError('El correo no es válido.');
    }

    const telRaw = String(this.proveedor.provTelefono ?? '').trim();
    const tel = this.soloDigitos(telRaw);
    if (telRaw && !this.validarTelefonoEC(tel)) {
      return this.setError('Teléfono inválido: debe iniciar con 09 (10 dígitos) o 02 (9 dígitos).');
    }

    const direccion = String(this.proveedor.provDireccion ?? '').trim();

    const dto: ProveedorEditarDto = {
      provNombre: nombre,
      provRuc: this.proveedor.provRuc ? String(this.proveedor.provRuc).trim() : null,
      provTelefono: telRaw ? tel : null,
      provDireccion: direccion ? direccion : null,
      provCorreo: correo ? correo : null
    };

    this.cargando = true;
    this.cdRef.detectChanges();

    this.proveedorService.editar(this.proveedor.provId, dto).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeOk = 'Proveedor actualizado correctamente.';
        this.cdRef.detectChanges();
        this.abrirModalOkAuto('Proveedor actualizado correctamente.');
      },
      error: (err) => {
        if (err?.status === 200) {
          this.cargando = false;
          this.mensajeOk = 'Proveedor actualizado correctamente.';
          this.cdRef.detectChanges();
          this.abrirModalOkAuto('Proveedor actualizado correctamente.');
          return;
        }

        if (err?.status === 401) {
          this.router.navigate(['/login']);
          return;
        }

        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al actualizar el proveedor.');
        this.cdRef.detectChanges();
      }
    });
  }

  volver(): void {
    this.router.navigate(['/panel/proveedor-lista']);
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

  private abrirModalOkAuto(msg: string): void {
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
      this.router.navigate(['/panel/proveedor-lista']);
    }, 2000);
  }
}