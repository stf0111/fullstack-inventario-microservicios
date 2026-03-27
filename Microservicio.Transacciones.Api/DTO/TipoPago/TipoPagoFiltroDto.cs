namespace Microservicio.Transacciones.Api.DTOs.TipoPago;

public class TipoPagoFiltroDto
{
    public string? Nombre { get; set; }

    public int Pagina { get; set; } = 1;

    public int RegistrosPorPagina { get; set; } = 10;
}