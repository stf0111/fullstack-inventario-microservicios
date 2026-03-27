import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiListResponse, ApiResponse } from '../core/models/api-response';

export interface UsuarioListadoDto {
  usuId: number;
  usuCedula: string;
  usuNombre: string;
  usuApellido: string;
  usuNombreCompleto: string;
  usuRol: string;
  usuEstado: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UsuarioCrearDto {
  usuCedula: string;
  usuNombre: string;
  usuApellido: string;
  usuRol: string; // ADMIN | OPERADOR | VENDEDOR
  usuEstado: boolean;
  password: string;
}

export interface UsuarioEditarDto {
  usuCedula: string;
  usuNombre: string;
  usuApellido: string;
  usuRol: string; // ADMIN | OPERADOR | VENDEDOR
  usuEstado: boolean;
  password?: string | null;
}

export interface UsuarioFiltroDto {
  cedula?: string;
  nombre?: string;
  rol?: string;
  usuEstado?: boolean;
  pagina?: number;
  registrosPorPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private readonly API = environment.catalogoApiUrl;

  listar(filtro?: UsuarioFiltroDto): Observable<ApiListResponse<UsuarioListadoDto>> {
    let params = new HttpParams();

    if (filtro?.cedula) params = params.set('cedula', filtro.cedula);
    if (filtro?.nombre) params = params.set('nombre', filtro.nombre);
    if (filtro?.rol) params = params.set('rol', filtro.rol);
    if (filtro?.usuEstado != null) params = params.set('usuEstado', filtro.usuEstado);
    if (filtro?.pagina != null) params = params.set('pagina', filtro.pagina);
    if (filtro?.registrosPorPagina != null) {
      params = params.set('registrosPorPagina', filtro.registrosPorPagina);
    }

    return this.http.get<ApiListResponse<UsuarioListadoDto>>(`${this.API}/api/Usuario`, { params });
  }

  obtenerPorId(id: number): Observable<ApiResponse<UsuarioListadoDto>> {
    return this.http.get<ApiResponse<UsuarioListadoDto>>(`${this.API}/api/Usuario/${id}`);
  }

  crear(dto: UsuarioCrearDto): Observable<ApiResponse<UsuarioListadoDto>> {
    return this.http.post<ApiResponse<UsuarioListadoDto>>(`${this.API}/api/Usuario`, dto);
  }

  editar(id: number, dto: UsuarioEditarDto): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/api/Usuario/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API}/api/Usuario/${id}`);
  }
}