import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiResponse } from '../core/models/api-response';

export interface AjusteStockRequestDto {
  nuevoStock: number;
  motivo?: string | null;
  documentoReferencia?: string | null;
}

export interface AjusteStockResponseDto {
  prodId: number;
  prodNombre: string;
  stockAnterior: number;
  nuevoStock: number;
  diferencia: number;
  operacionAplicada: string;
  kardexId: number | null;
}

@Injectable({ providedIn: 'root' })
export class AjusteStockService {
  private http = inject(HttpClient);
  private readonly API = environment.transaccionesApiUrl;

  ajustar(prodId: number, dto: AjusteStockRequestDto): Observable<ApiResponse<AjusteStockResponseDto>> {
    return this.http.post<ApiResponse<AjusteStockResponseDto>>(
      `${this.API}/api/AjusteStock/${prodId}`,
      dto
    );
  }
}