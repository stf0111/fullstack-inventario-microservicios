import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiResponse } from '../core/models/api-response';

export interface ConfiguracionDto {
  confId: number;
  ivaPorcentaje: number;
  establecimiento: string;
  puntoEmision: string;
  ultimoSecuencial: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface ConfiguracionCrearDto {
  ivaPorcentaje: number;
  establecimiento: string;
  puntoEmision: string;
  ultimoSecuencial: number;
}

export interface ConfiguracionEditarDto extends ConfiguracionCrearDto {}

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private http = inject(HttpClient);
  private readonly API = environment.catalogoApiUrl;

  obtener(): Observable<ApiResponse<ConfiguracionDto>> {
    return this.http.get<ApiResponse<ConfiguracionDto>>(`${this.API}/api/Configuracion`);
  }

  crear(dto: ConfiguracionCrearDto): Observable<ApiResponse<ConfiguracionDto>> {
    return this.http.post<ApiResponse<ConfiguracionDto>>(`${this.API}/api/Configuracion`, dto);
  }

  editar(id: number, dto: ConfiguracionEditarDto): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API}/api/Configuracion/${id}`, dto);
  }
}