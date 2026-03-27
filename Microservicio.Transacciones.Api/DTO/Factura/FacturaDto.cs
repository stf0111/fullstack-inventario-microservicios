namespace Microservicio.Transacciones.Api.DTOs.Factura;

public class FacturaDto
{
    public int FacId { get; set; }
    public int CliId { get; set; }
    public string? CliNombreCompleto { get; set; }
    public int? UsuId { get; set; }
    public int TpaId { get; set; }
    public string? TpaNombre { get; set; }
    public DateOnly FacFecha { get; set; }
    public string? FacNumeroSerie { get; set; }
    public decimal FacSubtotal { get; set; }
    public decimal FacIvaValor { get; set; }
    public decimal FacTotal { get; set; }
    public bool? FacEstado { get; set; }
    public List<FacturaDetalleDto> Detalles { get; set; } = new();
}