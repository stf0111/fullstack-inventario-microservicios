import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiListResponse, ApiResponse } from '../core/models/api-response';

export interface MarcaListadoDto {
  marcaId: number;
  marcaNombre: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface MarcaCrearDto {
  marcaNombre: string;
}

export interface MarcaEditarDto extends MarcaCrearDto {}

export interface MarcaFiltroDto {
  nombre?: string;
  pagina?: number;
  registrosPorPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class MarcaService {
  private http = inject(HttpClient);
  private readonly API = environment.catalogoApiUrl;

  listar(filtro?: MarcaFiltroDto): Observable<ApiListResponse<MarcaListadoDto>> {
    let params = new HttpParams();

    if (filtro?.nombre) params = params.set('nombre', filtro.nombre);
    if (filtro?.pagina != null) params = params.set('pagina', filtro.pagina);
    if (filtro?.registrosPorPagina != null) {
      params = params.set('registrosPorPagina', filtro.registrosPorPagina);
    }

    return this.http.get<ApiListResponse<MarcaListadoDto>>(`${this.API}/api/Marca`, { params });
  }

  obtenerPorId(id: number): Observable<ApiResponse<MarcaListadoDto>> {
    return this.http.get<ApiResponse<MarcaListadoDto>>(`${this.API}/api/Marca/${id}`);
  }

  crear(dto: MarcaCrearDto): Observable<ApiResponse<MarcaListadoDto>> {
    return this.http.post<ApiResponse<MarcaListadoDto>>(`${this.API}/api/Marca`, dto);
  }

  editar(id: number, dto: MarcaEditarDto): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/api/Marca/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API}/api/Marca/${id}`);
  }
}