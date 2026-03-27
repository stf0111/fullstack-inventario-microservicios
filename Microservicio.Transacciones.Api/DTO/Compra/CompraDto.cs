namespace Microservicio.Transacciones.Api.DTOs.Compra;

public class CompraDto
{
    public int CompraId { get; set; }
    public int ProvId { get; set; }
    public string? ProvNombre { get; set; }
    public DateOnly CompraFecha { get; set; }
    public int UsuId { get; set; }
    public decimal Total { get; set; }
    public List<CompraDetalleDto> Detalles { get; set; } = new();
}