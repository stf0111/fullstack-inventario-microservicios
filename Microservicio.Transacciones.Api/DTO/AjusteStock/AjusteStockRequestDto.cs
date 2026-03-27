namespace Microservicio.Transacciones.Api.DTOs.AjusteStock;

public class AjusteStockRequestDto
{
    public int NuevoStock { get; set; }
    public string? Motivo { get; set; }
    public string? DocumentoReferencia { get; set; }
}