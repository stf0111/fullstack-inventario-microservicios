import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiListResponse, ApiResponse } from '../core/models/api-response';

export interface KardexDto {
  kdxId: number;
  kdxTipo: string;
  kdxMotivo: string | null;
  kdxDocRefer: string | null;
  kdxFecha: string;
  prodId: number;
  usuId: number | null;
  kdxCantidad: number;
  kdxSaldoAnt: number;
  kdxSaldoFinal: number;
  kdxCostoUnit: number;
  kdxPrecioUnit: number;
}

export interface KardexFiltroDto {
  prodId?: number;
  usuId?: number;
  kdxTipo?: string;
  fechaInicio?: string;
  fechaFin?: string;
  pagina?: number;
  registrosPorPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class KardexService {
  private http = inject(HttpClient);
  private readonly API = environment.transaccionesApiUrl;

  listar(filtro?: KardexFiltroDto): Observable<ApiListResponse<KardexDto>> {
    let params = new HttpParams();

    if (filtro?.prodId != null) params = params.set('prodId', filtro.prodId);
    if (filtro?.usuId != null) params = params.set('usuId', filtro.usuId);
    if (filtro?.kdxTipo) params = params.set('kdxTipo', filtro.kdxTipo);
    if (filtro?.fechaInicio) params = params.set('fechaInicio', filtro.fechaInicio);
    if (filtro?.fechaFin) params = params.set('fechaFin', filtro.fechaFin);
    if (filtro?.pagina != null) params = params.set('pagina', filtro.pagina);
    if (filtro?.registrosPorPagina != null) {
      params = params.set('registrosPorPagina', filtro.registrosPorPagina);
    }

    return this.http.get<ApiListResponse<KardexDto>>(`${this.API}/api/Kardex`, { params });
  }

  obtenerPorId(id: number): Observable<ApiResponse<KardexDto>> {
    return this.http.get<ApiResponse<KardexDto>>(`${this.API}/api/Kardex/${id}`);
  }
}