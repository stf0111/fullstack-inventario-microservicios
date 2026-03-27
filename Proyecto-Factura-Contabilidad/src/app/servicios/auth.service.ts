import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ApiResponse } from '../core/models/api-response';

export interface LoginRequestDto {
  usuCedula: string;
  password: string;
}

export interface UsuarioAutenticadoDto {
  usuId: number;
  usuCedula: string;
  usuNombreCompleto: string;
  usuRol: string;
  usuEstado: boolean;
}

export interface LoginResponseDto {
  token: string;
  expiracion: string;
  usuario: UsuarioAutenticadoDto;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly API = environment.catalogoApiUrl;
  private readonly TOKEN_KEY = 'auth_token';

  login(dto: LoginRequestDto): Observable<ApiResponse<LoginResponseDto>> {
    return this.http
      .post<ApiResponse<LoginResponseDto>>(`${this.API}/api/Auth/login`, dto)
      .pipe(
        tap(response => {
          const token = response?.datos?.token;
          if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
          }
        })
      );
  }

  me(): Observable<ApiResponse<UsuarioAutenticadoDto>> {
    return this.http.get<ApiResponse<UsuarioAutenticadoDto>>(`${this.API}/api/Auth/me`);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}