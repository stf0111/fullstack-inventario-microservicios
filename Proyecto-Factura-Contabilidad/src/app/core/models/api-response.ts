export interface ApiResponse<T> {
  mensaje: string;
  datos: T;
}

export interface ApiListResponse<T> {
  mensaje: string;
  totalRegistros: number;
  pagina: number;
  registrosPorPagina: number;
  datos: T[];
}