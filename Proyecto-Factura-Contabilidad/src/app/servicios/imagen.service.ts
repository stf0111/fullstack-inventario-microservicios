import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiListResponse, ApiResponse } from '../core/models/api-response';

export interface ImagenListadoDto {
  imgId: number;
  prodId: number;
  prodNombre: string | null;
  imgNombre: string | null;
  imgUrl: string;
  imgDescripcion: string | null;
  esPrincipal: boolean;
  orden: number;
  imgEstado: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ImagenCrearDto {
  prodId: number;
  imgNombre?: string | null;
  imgUrl: string;
  imgDescripcion?: string | null;
  esPrincipal?: boolean;
  orden?: number;
  imgEstado?: boolean;
}

export interface ImagenEditarDto {
  prodId: number;
  imgNombre?: string | null;
  imgUrl: string;
  imgDescripcion?: string | null;
  esPrincipal: boolean;
  orden: number;
  imgEstado: boolean;
}

export interface ImagenFiltroDto {
  prodId?: number;
  esPrincipal?: boolean;
  imgEstado?: boolean;
  pagina?: number;
  registrosPorPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class ImagenService {
  private http = inject(HttpClient);
  private readonly API = environment.catalogoApiUrl;

  listar(filtro?: ImagenFiltroDto): Observable<ApiListResponse<ImagenListadoDto>> {
    let params = new HttpParams();

    if (filtro?.prodId != null) params = params.set('prodId', filtro.prodId);
    if (filtro?.esPrincipal != null) params = params.set('esPrincipal', filtro.esPrincipal);
    if (filtro?.imgEstado != null) params = params.set('imgEstado', filtro.imgEstado);
    if (filtro?.pagina != null) params = params.set('pagina', filtro.pagina);
    if (filtro?.registrosPorPagina != null) {
      params = params.set('registrosPorPagina', filtro.registrosPorPagina);
    }

    return this.http.get<ApiListResponse<ImagenListadoDto>>(`${this.API}/api/Imagen`, { params });
  }

  obtenerPorId(id: number): Observable<ApiResponse<ImagenListadoDto>> {
    return this.http.get<ApiResponse<ImagenListadoDto>>(`${this.API}/api/Imagen/${id}`);
  }

  crear(dto: ImagenCrearDto): Observable<ApiResponse<ImagenListadoDto>> {
    return this.http.post<ApiResponse<ImagenListadoDto>>(`${this.API}/api/Imagen`, dto);
  }

  editar(id: number, dto: ImagenEditarDto): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/api/Imagen/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API}/api/Imagen/${id}`);
  }
}