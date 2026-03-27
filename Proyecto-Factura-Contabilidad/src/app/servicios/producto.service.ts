import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiListResponse, ApiResponse } from '../core/models/api-response';

export interface ProductoListadoDto {
  prodId: number;
  prodNombre: string;
  prodDescripcion: string | null;
  catId: number;
  catNombre: string | null;
  marcaId: number;
  marcaNombre: string | null;
  prodPrecioven: number;
  prodPreciocom: number;
  prodCantidad: number;
  prodEstado: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface ProductoCrearDto {
  prodNombre: string;
  prodDescripcion?: string | null;
  catId: number;
  marcaId: number;
  prodPrecioven: number;
  prodPreciocom: number;
  prodCantidad: number;
  prodEstado: boolean;
}

export interface ProductoEditarDto extends ProductoCrearDto {}

export interface ProductoFiltroDto {
  nombre?: string;
  catId?: number;
  marcaId?: number;
  prodEstado?: boolean;
  precioMin?: number;
  precioMax?: number;
  pagina?: number;
  registrosPorPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private http = inject(HttpClient);
  private readonly API = environment.catalogoApiUrl;

  listar(filtro?: ProductoFiltroDto): Observable<ApiListResponse<ProductoListadoDto>> {
    let params = new HttpParams();

    if (filtro?.nombre) params = params.set('nombre', filtro.nombre);
    if (filtro?.catId != null) params = params.set('catId', filtro.catId);
    if (filtro?.marcaId != null) params = params.set('marcaId', filtro.marcaId);
    if (filtro?.prodEstado != null) params = params.set('prodEstado', filtro.prodEstado);
    if (filtro?.precioMin != null) params = params.set('precioMin', filtro.precioMin);
    if (filtro?.precioMax != null) params = params.set('precioMax', filtro.precioMax);
    if (filtro?.pagina != null) params = params.set('pagina', filtro.pagina);
    if (filtro?.registrosPorPagina != null) {
      params = params.set('registrosPorPagina', filtro.registrosPorPagina);
    }

    return this.http.get<ApiListResponse<ProductoListadoDto>>(`${this.API}/api/Producto`, { params });
  }

  obtenerPorId(id: number): Observable<ApiResponse<ProductoListadoDto>> {
    return this.http.get<ApiResponse<ProductoListadoDto>>(`${this.API}/api/Producto/${id}`);
  }

  crear(dto: ProductoCrearDto): Observable<ApiResponse<ProductoListadoDto>> {
    return this.http.post<ApiResponse<ProductoListadoDto>>(`${this.API}/api/Producto`, dto);
  }

  editar(id: number, dto: ProductoEditarDto): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/api/Producto/${id}`, dto);
  }

  eliminar(id: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.API}/api/Producto/${id}`);
  }
}