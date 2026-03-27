import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiListResponse, ApiResponse } from '../core/models/api-response';

export interface CompraDetalleCrearDto {
  prodId: number;
  cantidad: number;
  precio: number;
}

export interface CompraCrearDto {
  provId: number;
  compraFecha?: string | null;
  detalles: CompraDetalleCrearDto[];
}

export interface CompraDetalleDto {
  prodId: number;
  prodNombre: string | null;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface CompraDto {
  compraId: number;
  provId: number;
  provNombre: string | null;
  compraFecha: string;
  usuId: number;
  total: number;
  detalles: CompraDetalleDto[];
}

export interface CompraFiltroDto {
  provId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  pagina?: number;
  registrosPorPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class CompraService {
  private http = inject(HttpClient);
  private readonly API = environment.transaccionesApiUrl;

  listar(filtro?: CompraFiltroDto): Observable<ApiListResponse<CompraDto>> {
    let params = new HttpParams();

    if (filtro?.provId != null) params = params.set('provId', filtro.provId);
    if (filtro?.fechaInicio) params = params.set('fechaInicio', filtro.fechaInicio);
    if (filtro?.fechaFin) params = params.set('fechaFin', filtro.fechaFin);
    if (filtro?.pagina != null) params = params.set('pagina', filtro.pagina);
    if (filtro?.registrosPorPagina != null) {
      params = params.set('registrosPorPagina', filtro.registrosPorPagina);
    }

    return this.http.get<ApiListResponse<CompraDto>>(`${this.API}/api/Compra`, { params });
  }

  obtenerPorId(id: number): Observable<ApiResponse<CompraDto>> {
    return this.http.get<ApiResponse<CompraDto>>(`${this.API}/api/Compra/${id}`);
  }

  crear(dto: CompraCrearDto): Observable<ApiResponse<CompraDto>> {
    return this.http.post<ApiResponse<CompraDto>>(`${this.API}/api/Compra`, dto);
  }
}