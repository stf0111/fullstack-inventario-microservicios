namespace Microservicio.Catalogo.Api.DTOs.Configuracion;

public class ConfiguracionDto
{
    public int ConfId { get; set; }

    public decimal IvaPorcentaje { get; set; }

    public string Establecimiento { get; set; } = null!;

    public string PuntoEmision { get; set; } = null!;

    public int UltimoSecuencial { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}