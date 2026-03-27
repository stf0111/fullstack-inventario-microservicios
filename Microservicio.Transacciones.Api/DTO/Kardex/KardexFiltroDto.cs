namespace Microservicio.Transacciones.Api.DTOs.Kardex;

public class KardexFiltroDto
{
    public int? ProdId { get; set; }

    public int? UsuId { get; set; }

    public string? KdxTipo { get; set; }

    public string? KdxMotivo { get; set; }

    public DateTime? FechaInicio { get; set; }

    public DateTime? FechaFin { get; set; }

    public int Pagina { get; set; } = 1;

    public int RegistrosPorPagina { get; set; } = 10;
}