import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiListResponse, ApiResponse } from '../core/models/api-response';

export interface ProveedorListadoDto {
  provId: number;
  provNombre: string;
  provRuc: string | null;
  provTelefono: string | null;
  provDireccion: string | null;
  provCorreo: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ProveedorCrearDto {
  provNombre: string;
  provRuc?: string | null;
  provTelefono?: string | null;
  provDireccion?: string | null;
  provCorreo?: string | null;
}

export interface ProveedorEditarDto extends ProveedorCrearDto {}

export interface ProveedorFiltroDto {
  nombre?: string;
  ruc?: string;
  correo?: string;
  pagina?: number;
  registrosPorPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class ProveedorService {
  private http = inject(HttpClient);
  private readonly API = environment.transaccionesApiUrl;

  listar(filtro?: ProveedorFiltroDto): Observable<ApiListResponse<ProveedorListadoDto>> {
    let params = new HttpParams();

    if (filtro?.nombre) params = params.set('nombre', filtro.nombre);
    if (filtro?.ruc) params = params.set('ruc', filtro.ruc);
    if (filtro?.correo) params = params.set('correo', filtro.correo);
    if (filtro?.pagina != null) params = params.set('pagina', filtro.pagina);
    if (filtro?.registrosPorPagina != null) {
      params = params.set('registrosPorPagina', filtro.registrosPorPagina);
    }

    return this.http.get<ApiListResponse<ProveedorListadoDto>>(`${this.API}/api/Proveedor`, { params });
  }

  obtenerPorId(id: number): Observable<ApiResponse<ProveedorListadoDto>> {
    return this.http.get<ApiResponse<ProveedorListadoDto>>(`${this.API}/api/Proveedor/${id}`);
  }

  crear(dto: ProveedorCrearDto): Observable<ApiResponse<ProveedorListadoDto>> {
    return this.http.post<ApiResponse<ProveedorListadoDto>>(`${this.API}/api/Proveedor`, dto);
  }

  editar(id: number, dto: ProveedorEditarDto): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/api/Proveedor/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API}/api/Proveedor/${id}`);
  }
}