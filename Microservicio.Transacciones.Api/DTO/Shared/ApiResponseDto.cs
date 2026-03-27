namespace Microservicio.Transacciones.Api.DTOs.Shared;

public class ApiResponseDto<T>
{
    public string Mensaje { get; set; } = null!;
    public T Datos { get; set; } = default!;
}