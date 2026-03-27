import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiListResponse, ApiResponse } from '../core/models/api-response';

export interface TipoPagoListadoDto {
  tpaId: number;
  tpaNombre: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface TipoPagoCrearDto {
  tpaNombre: string;
}

export interface TipoPagoEditarDto extends TipoPagoCrearDto {}

export interface TipoPagoFiltroDto {
  nombre?: string;
  pagina?: number;
  registrosPorPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class TipoPagoService {
  private http = inject(HttpClient);
  private readonly API = environment.transaccionesApiUrl;

  listar(filtro?: TipoPagoFiltroDto): Observable<ApiListResponse<TipoPagoListadoDto>> {
    let params = new HttpParams();

    if (filtro?.nombre) params = params.set('nombre', filtro.nombre);
    if (filtro?.pagina != null) params = params.set('pagina', filtro.pagina);
    if (filtro?.registrosPorPagina != null) {
      params = params.set('registrosPorPagina', filtro.registrosPorPagina);
    }

    return this.http.get<ApiListResponse<TipoPagoListadoDto>>(`${this.API}/api/TipoPago`, { params });
  }

  obtenerPorId(id: number): Observable<ApiResponse<TipoPagoListadoDto>> {
    return this.http.get<ApiResponse<TipoPagoListadoDto>>(`${this.API}/api/TipoPago/${id}`);
  }

  crear(dto: TipoPagoCrearDto): Observable<ApiResponse<TipoPagoListadoDto>> {
    return this.http.post<ApiResponse<TipoPagoListadoDto>>(`${this.API}/api/TipoPago`, dto);
  }

  editar(id: number, dto: TipoPagoEditarDto): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/api/TipoPago/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API}/api/TipoPago/${id}`);
  }
}