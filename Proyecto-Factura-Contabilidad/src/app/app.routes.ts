import { Routes } from '@angular/router';
import { LoginComponent } from './login/login';
import { PanelLayoutComponent } from './panel/panel-layout/panel-layout';
import { PanelInicioComponent } from './panel/panel-inicio/panel-inicio';
import { authGuard } from './core/auth.guard';
import { UsuarioLista } from './panel/panel-usuario/usuario-lista/usuario-lista';
import { UsuarioCrear } from './panel/panel-usuario/usuario-crear/usuario-crear';
import { UsuarioModificar } from './panel/panel-usuario/usuario-modificar/usuario-modificar';
import { UsuarioPerfil } from './panel/panel-usuario/usuario-perfil/usuario-perfil';
import { ClienteCrear } from './panel/panel-cliente/cliente-crear/cliente-crear';
import { ClienteLista } from './panel/panel-cliente/cliente-lista/cliente-lista';
import { ClienteModificar } from './panel/panel-cliente/cliente-modificar/cliente-modificar';
import { ProveedorLista } from './panel/panel-proveedor/proveedor-lista/proveedor-lista';
import { ProveedorCrear } from './panel/panel-proveedor/proveedor-crear/proveedor-crear';
import { ProveedorModificar } from './panel/panel-proveedor/proveedor-modificar/proveedor-modificar';
import { ProductoLista } from './panel/panel-producto/producto-lista/producto-lista';
import { ProductoCrear } from './panel/panel-producto/producto-crear/producto-crear';
import { ProductoModificar } from './panel/panel-producto/producto-modificar/producto-modificar';
import { MarcaLista } from './panel/panel-marca/marca-lista/marca-lista';
import { MarcaCrear } from './panel/panel-marca/marca-crear/marca-crear';
import { CategoriaLista } from './panel/panel-categoria/categoria-lista/categoria-lista';
import { CategoriaCrear } from './panel/panel-categoria/categoria-crear/categoria-crear';
import { TipoPagoLista } from './panel/panel-tipo-pago/tipo-pago-lista/tipo-pago-lista';
import { TipoPagoCrear } from './panel/panel-tipo-pago/tipo-pago-crear/tipo-pago-crear';
import { ConfiguracionInicio } from './panel/panel-configuración/configuracion-inicio/configuracion-inicio';
import { KardexLista } from './panel/panel-kardex/kardex-lista/kardex-lista';
import { ImagenLista } from './panel/panel-imagen/imagen-lista/imagen-lista';
import { ImagenCrear } from './panel/panel-imagen/imagen-crear/imagen-crear';
import { ImagenModificar } from './panel/panel-imagen/imagen-modificar/imagen-modificar';
import { FacturaLista } from './panel/panel-factura/factura-lista/factura-lista';
import { FacturaRegistrar } from './panel/panel-factura/factura-registrar/factura-registrar';
import { DetalleFactura } from './panel/panel-factura/detalle-factura/detalle-factura';
import { FacturaClienteCrear } from './panel/panel-factura/factura-cliente-crear/factura-cliente-crear';
import { DetalleCompra } from './panel/panel-compra/detalle-compra/detalle-compra';
import { CompraLista } from './panel/panel-compra/compra-lista/compra-lista';
import { CompraRegistrar } from './panel/panel-compra/compra-registrar/compra-registrar';
import { AjusteLista } from './panel/panel-ajuste/ajuste-lista/ajuste-lista';
import { ReporteStockProductoLista } from './panel/panel-reporte/reporte-stock-producto-lista/reporte-stock-producto-lista';



export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: LoginComponent },

  {
    path: 'panel',
    component: PanelLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      { path: 'inicio', component: PanelInicioComponent },
      { path: 'usuario-lista', component: UsuarioLista },
      { path: 'usuario-crear', component: UsuarioCrear },
      { path: 'usuario-modificar/:id', component: UsuarioModificar },
      { path: 'usuario-perfil', component: UsuarioPerfil },
      { path: 'cliente-lista', component: ClienteLista },
      { path: 'cliente-crear', component: ClienteCrear },
      { path: 'cliente-modificar/:id', component: ClienteModificar },
      { path: 'proveedor-lista', component: ProveedorLista },
      { path: 'proveedor-crear', component: ProveedorCrear },
      { path: 'proveedor-modificar/:id', component: ProveedorModificar },  
      { path: 'producto-lista', component: ProductoLista },
      { path: 'producto-crear', component: ProductoCrear },
      { path: 'producto-modificar/:id', component: ProductoModificar },
      { path: 'marca-lista', component: MarcaLista },
      { path: 'marca-crear', component: MarcaCrear },
      { path: 'categoria-lista', component: CategoriaLista },
      { path: 'categoria-crear', component: CategoriaCrear },
      { path: 'tipo-pago-lista', component: TipoPagoLista },
      { path: 'tipo-pago-crear', component: TipoPagoCrear },
      { path: 'configuracion', component: ConfiguracionInicio },
      { path: 'kardex-lista', component: KardexLista },
      { path: 'imagen-lista', component: ImagenLista },
      { path: 'imagen-crear', component: ImagenCrear },
      { path: 'imagen-modificar/:id', component: ImagenModificar },
      { path: 'factura-lista', component: FacturaLista },
      { path: 'factura-registrar', component: FacturaRegistrar },
      { path: 'cliente-factura-crear', component: FacturaClienteCrear },
      { path: 'detalle-factura/:id', component: DetalleFactura },
      { path: 'detalle-compra/:id', component: DetalleCompra },
      { path: 'compra-lista', component: CompraLista },
      { path: 'compra-registrar', component: CompraRegistrar },
      { path: 'ajuste-lista', component: AjusteLista },
      { path: 'reporte-stock-producto-lista', component: ReporteStockProductoLista },


            
    ]
  },

  { path: '**', redirectTo: 'login' }
];