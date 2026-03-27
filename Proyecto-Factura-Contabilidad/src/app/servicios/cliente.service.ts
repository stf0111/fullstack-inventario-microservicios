import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiListResponse, ApiResponse } from '../core/models/api-response';

export interface ClienteListadoDto {
  cliId: number;
  cliCedula: string | null;
  cliNombre: string;
  cliApellido: string;
  cliNombreCompleto: string;
  cliDireccion: string | null;
  cliCorreo: string | null;
  cliTelefono: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ClienteCrearDto {
  cliCedula?: string | null;
  cliNombre: string;
  cliApellido: string;
  cliDireccion?: string | null;
  cliCorreo?: string | null;
  cliTelefono?: string | null;
}

export interface ClienteEditarDto extends ClienteCrearDto {}

export interface ClienteFiltroDto {
  cedula?: string;
  nombre?: string;
  correo?: string;
  pagina?: number;
  registrosPorPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private http = inject(HttpClient);
  private readonly API = environment.transaccionesApiUrl;

  listar(filtro?: ClienteFiltroDto): Observable<ApiListResponse<ClienteListadoDto>> {
    let params = new HttpParams();

    if (filtro?.cedula) params = params.set('cedula', filtro.cedula);
    if (filtro?.nombre) params = params.set('nombre', filtro.nombre);
    if (filtro?.correo) params = params.set('correo', filtro.correo);
    if (filtro?.pagina != null) params = params.set('pagina', filtro.pagina);
    if (filtro?.registrosPorPagina != null) {
      params = params.set('registrosPorPagina', filtro.registrosPorPagina);
    }

    return this.http.get<ApiListResponse<ClienteListadoDto>>(`${this.API}/api/Cliente`, { params });
  }

  obtenerPorId(id: number): Observable<ApiResponse<ClienteListadoDto>> {
    return this.http.get<ApiResponse<ClienteListadoDto>>(`${this.API}/api/Cliente/${id}`);
  }

  crear(dto: ClienteCrearDto): Observable<ApiResponse<ClienteListadoDto>> {
    return this.http.post<ApiResponse<ClienteListadoDto>>(`${this.API}/api/Cliente`, dto);
  }

  editar(id: number, dto: ClienteEditarDto): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/api/Cliente/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API}/api/Cliente/${id}`);
  }
}