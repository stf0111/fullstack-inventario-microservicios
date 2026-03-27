namespace Microservicio.Transacciones.Api.DTOs.Compra;

public class CompraFiltroDto
{
    public int? ProvId { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public int Pagina { get; set; } = 1;
    public int RegistrosPorPagina { get; set; } = 10;
}