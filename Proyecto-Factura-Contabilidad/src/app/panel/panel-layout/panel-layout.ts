import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterOutlet, RouterLinkActive, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { AuthService, UsuarioAutenticadoDto } from '../../servicios/auth.service';

type RolApp = 'ADMIN' | 'OPERADOR' | 'VENDEDOR' | 'USUARIO';

@Component({
  selector: 'app-panel-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './panel-layout.html',
  styleUrls: ['./panel-layout.css']
})
export class PanelLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  anioActual = new Date().getFullYear();

  usuario: UsuarioAutenticadoDto | null = null;
  usuarioNombreCompleto = '';
  usuarioRolLegible = '';
  inicialUsuario = 'U';

  rolUsuario: RolApp = 'USUARIO';

  sidebarOpen = false;

  ngOnInit(): void {
    this.cargarUsuario();
  }

  private ui(): void {
    queueMicrotask(() => this.cdr.detectChanges());
  }

  private normalizarRol(rol: string | null | undefined): RolApp {
    const r = String(rol ?? '').trim().toUpperCase();

    if (r === 'ADMIN') return 'ADMIN';
    if (r === 'OPERADOR') return 'OPERADOR';
    if (r === 'VENDEDOR') return 'VENDEDOR';

    return 'USUARIO';
  }

  private formatearRol(rol: RolApp): string {
    switch (rol) {
      case 'ADMIN':
        return 'Administrador';
      case 'OPERADOR':
        return 'Operador';
      case 'VENDEDOR':
        return 'Vendedor';
      default:
        return 'Usuario';
    }
  }

  cargarUsuario(): void {
    this.authService.me().pipe(take(1)).subscribe({
      next: (response) => {
        const me = response?.datos;

        if (!me) {
          this.router.navigate(['/login']);
          return;
        }

        this.usuario = me;
        this.usuarioNombreCompleto = String(me.usuNombreCompleto ?? '').trim() || 'Usuario';
        this.inicialUsuario = this.usuarioNombreCompleto.charAt(0).toUpperCase() || 'U';

        this.rolUsuario = this.normalizarRol(me.usuRol);
        this.usuarioRolLegible = this.formatearRol(this.rolUsuario);

        this.ui();
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    this.ui();
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
    this.ui();
  }

  // =========================
  // PERMISOS
  // =========================

  esAdmin(): boolean {
    return this.rolUsuario === 'ADMIN';
  }

  esOperador(): boolean {
    return this.rolUsuario === 'OPERADOR';
  }

  esVendedor(): boolean {
    return this.rolUsuario === 'VENDEDOR';
  }

  puedeVerUsuarios(): boolean {
    return this.esAdmin();
  }

  puedeVerConfiguracion(): boolean {
    return this.esAdmin();
  }

  puedeVerReportes(): boolean {
    return this.esAdmin();
  }

  puedeVerAjustesInventario(): boolean {
    return this.esAdmin();
  }

  puedeVerAjustePlanes(): boolean {
    return this.esAdmin();
  }

  puedeVerCompras(): boolean {
    return this.esAdmin() || this.esOperador();
  }

  puedeRegistrarCompra(): boolean {
    return this.esAdmin() || this.esOperador();
  }

  puedeVerProveedores(): boolean {
    return this.esAdmin() || this.esOperador();
  }

  puedeVerGastos(): boolean {
    return this.esAdmin() || this.esOperador();
  }

  puedeVerTiposPago(): boolean {
    return this.esAdmin() || this.esOperador();
  }

  puedeVerFacturas(): boolean {
    return this.esAdmin() || this.esOperador() || this.esVendedor();
  }

  puedeRegistrarVenta(): boolean {
    return this.esAdmin() || this.esOperador() || this.esVendedor();
  }

  puedeVerClientes(): boolean {
    return this.esAdmin() || this.esOperador() || this.esVendedor();
  }

  puedeVerProductos(): boolean {
    return this.esAdmin() || this.esOperador() || this.esVendedor();
  }

  puedeVerInventario(): boolean {
    return this.esAdmin() || this.esOperador();
  }

  puedeVerHistorialPrecios(): boolean {
    return this.esAdmin() || this.esOperador();
  }
}