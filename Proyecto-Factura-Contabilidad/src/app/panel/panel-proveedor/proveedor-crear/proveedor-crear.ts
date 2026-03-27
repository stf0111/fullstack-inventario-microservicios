import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { AuthService, UsuarioAutenticadoDto } from '../../../servicios/auth.service';
import { ProveedorService } from '../../../servicios/proveedor.service';

@Component({
  selector: 'app-proveedor-crear',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedor-crear.html',
  styleUrls: ['./proveedor-crear.css'],
})
export class ProveedorCrear implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private proveedorService = inject(ProveedorService);
  private router = inject(Router);
  private cdRef = inject(ChangeDetectorRef);

  cargando = false;
  mensajeError = '';
  mensajeOk = '';

  // Sesión + rol
  usuarioActual: UsuarioAutenticadoDto | null = null;
  rolUsuario = '';

  // Form
  proveedor = {
    provNombre: '',
    provRuc: '',
    provTelefono: '',
    provDireccion: '',
    provCorreo: '',
  };

  // Modal OK
  modalOkVisible = false;
  modalOkMensaje = '';
  private okTimer: ReturnType<typeof setTimeout> | null = null;

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
        this.rolUsuario = this.esAdmin(me.usuRol) ? 'ADMIN' : (me.usuRol ?? 'Usuario');
        this.cdRef.detectChanges();
      },
      error: () => {
        this.router.navigate(['/login']);
      },
    });
  }

  private esAdmin(rol: string | null | undefined): boolean {
    const r = String(rol ?? '').trim().toLowerCase();
    return r === 'adm' || r === 'admin' || r.startsWith('admin') || r.includes('administrador');
  }

  esAdminUI(): boolean {
    if (!this.usuarioActual) return false;
    return this.esAdmin(this.usuarioActual.usuRol);
  }

  volver(): void {
    this.router.navigate(['/panel/proveedor-lista']);
  }

  // =========================
  // VALIDACIONES
  // =========================
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

    if (t.startsWith('09')) {
      return t.length === 10;
    }

    const prefijo = t.substring(0, 2);
    const prefijosConvencional = ['02', '03', '04', '05', '06', '07'];

    if (prefijosConvencional.includes(prefijo)) {
      return t.length === 9;
    }

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
    const digitos = numero.split('').map((n) => Number(n));
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

  // =========================
  // MODAL OK AUTO
  // =========================
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

  // =========================
  // GUARDAR
  // =========================
  guardarProveedor(): void {
    if (this.cargando) return;

    if (!this.esAdminUI()) {
      this.mensajeError = 'Sin permisos: solo un administrador puede crear proveedores.';
      this.cdRef.detectChanges();
      return;
    }

    this.mensajeError = '';
    this.mensajeOk = '';
    this.cdRef.detectChanges();

    const nombre = (this.proveedor.provNombre ?? '').trim();
    if (!nombre) {
      this.mensajeError = 'El nombre es obligatorio.';
      this.cdRef.detectChanges();
      return;
    }

    const rucRaw = (this.proveedor.provRuc ?? '').trim();
    const ruc = this.soloDigitos(rucRaw);
    if (rucRaw && !this.validarRucEC(ruc)) {
      this.mensajeError = 'El RUC no es válido.';
      this.cdRef.detectChanges();
      return;
    }

    const correo = (this.proveedor.provCorreo ?? '').trim();
    if (correo && !this.validarEmail(correo)) {
      this.mensajeError = 'El correo no es válido.';
      this.cdRef.detectChanges();
      return;
    }

    const telRaw = (this.proveedor.provTelefono ?? '').trim();
    const tel = this.soloDigitos(telRaw);
    if (telRaw && !this.validarTelefonoEC(tel)) {
      this.mensajeError = 'Teléfono inválido: se acepta 09XXXXXXXX o teléfono convencional de 9 dígitos con prefijo 02 al 07.';
      this.cdRef.detectChanges();
      return;
    }

    const direccion = (this.proveedor.provDireccion ?? '').trim();

    const dto = {
      provNombre: nombre,
      provRuc: rucRaw ? ruc : null,
      provTelefono: telRaw ? tel : null,
      provDireccion: direccion ? direccion : null,
      provCorreo: correo ? correo : null,
    };

    this.cargando = true;
    this.cdRef.detectChanges();

    this.proveedorService.crear(dto).pipe(take(1)).subscribe({
      next: () => {
        this.cargando = false;
        this.mensajeOk = 'Proveedor creado correctamente.';
        this.cdRef.detectChanges();

        this.proveedor = {
          provNombre: '',
          provRuc: '',
          provTelefono: '',
          provDireccion: '',
          provCorreo: '',
        };

        this.abrirModalOkAuto('Proveedor creado correctamente.');
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = this.extraerMensajeError(err, 'Error al crear el proveedor.');
        this.cdRef.detectChanges();
      },
    });
  }

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
}