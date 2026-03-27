namespace Microservicio.Transacciones.Api.DTOs.Factura;

public class FacturaFiltroDto
{
    public int? CliId { get; set; }
    public int? TpaId { get; set; }
    public bool? FacEstado { get; set; }
    public DateOnly? FechaInicio { get; set; }
    public DateOnly? FechaFin { get; set; }
    public int Pagina { get; set; } = 1;
    public int RegistrosPorPagina { get; set; } = 10;
}