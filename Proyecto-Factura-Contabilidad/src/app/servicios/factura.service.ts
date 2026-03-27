import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiListResponse, ApiResponse } from '../core/models/api-response';

export interface FacturaDetalleCrearDto {
  prodId: number;
  cantidad: number;
}

export interface FacturaCrearDto {
  cliId: number;
  tpaId: number;
  facFecha?: string | null;
  detalles: FacturaDetalleCrearDto[];
}

export interface FacturaDetalleDto {
  prodId: number;
  prodNombre: string | null;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface FacturaDto {
  facId: number;
  cliId: number;
  cliNombreCompleto: string | null;
  usuId: number | null;
  tpaId: number;
  tpaNombre: string | null;
  facFecha: string;
  facNumeroSerie: string | null;
  facSubtotal: number;
  facIvaValor: number;
  facTotal: number;
  facEstado: boolean | null;
  detalles: FacturaDetalleDto[];
}

export interface FacturaFiltroDto {
  cliId?: number;
  tpaId?: number;
  facEstado?: boolean;
  fechaInicio?: string;
  fechaFin?: string;
  pagina?: number;
  registrosPorPagina?: number;
}

@Injectable({ providedIn: 'root' })
export class FacturaService {
  private http = inject(HttpClient);
  private readonly API = environment.transaccionesApiUrl;

  listar(filtro?: FacturaFiltroDto): Observable<ApiListResponse<FacturaDto>> {
    let params = new HttpParams();

    if (filtro?.cliId != null) params = params.set('cliId', filtro.cliId);
    if (filtro?.tpaId != null) params = params.set('tpaId', filtro.tpaId);
    if (filtro?.facEstado != null) params = params.set('facEstado', filtro.facEstado);
    if (filtro?.fechaInicio) params = params.set('fechaInicio', filtro.fechaInicio);
    if (filtro?.fechaFin) params = params.set('fechaFin', filtro.fechaFin);
    if (filtro?.pagina != null) params = params.set('pagina', filtro.pagina);
    if (filtro?.registrosPorPagina != null) {
      params = params.set('registrosPorPagina', filtro.registrosPorPagina);
    }

    return this.http.get<ApiListResponse<FacturaDto>>(`${this.API}/api/Factura`, { params });
  }

  obtenerPorId(id: number): Observable<ApiResponse<FacturaDto>> {
    return this.http.get<ApiResponse<FacturaDto>>(`${this.API}/api/Factura/${id}`);
  }

  crear(dto: FacturaCrearDto): Observable<ApiResponse<FacturaDto>> {
    return this.http.post<ApiResponse<FacturaDto>>(`${this.API}/api/Factura`, dto);
  }
  
  anular(id: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/api/Factura/anular/${id}`, {});
  }
}