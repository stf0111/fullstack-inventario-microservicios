import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiListResponse, ApiResponse } from '../core/models/api-response';

export interface CategoriaListadoDto {
  catId: number;
  catNombre: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CategoriaCrearDto {
  catNombre: string;
}

export interface CategoriaEditarDto extends CategoriaCrearDto {}

export interface CategoriaFiltroDto {
  nombre?: string;
  pagina?: number;
  registrosPorPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private http = inject(HttpClient);
  private readonly API = environment.catalogoApiUrl;

  listar(filtro?: CategoriaFiltroDto): Observable<ApiListResponse<CategoriaListadoDto>> {
    let params = new HttpParams();

    if (filtro?.nombre) params = params.set('nombre', filtro.nombre);
    if (filtro?.pagina != null) params = params.set('pagina', filtro.pagina);
    if (filtro?.registrosPorPagina != null) {
      params = params.set('registrosPorPagina', filtro.registrosPorPagina);
    }

    return this.http.get<ApiListResponse<CategoriaListadoDto>>(`${this.API}/api/Categoria`, { params });
  }

  obtenerPorId(id: number): Observable<ApiResponse<CategoriaListadoDto>> {
    return this.http.get<ApiResponse<CategoriaListadoDto>>(`${this.API}/api/Categoria/${id}`);
  }

  crear(dto: CategoriaCrearDto): Observable<ApiResponse<CategoriaListadoDto>> {
    return this.http.post<ApiResponse<CategoriaListadoDto>>(`${this.API}/api/Categoria`, dto);
  }

  editar(id: number, dto: CategoriaEditarDto): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/api/Categoria/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API}/api/Categoria/${id}`);
  }
}