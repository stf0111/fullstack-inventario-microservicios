namespace Microservicio.Transacciones.Api.DTOs.Compra;

public class CompraDetalleDto
{
    public int ProdId { get; set; }
    public string? ProdNombre { get; set; }
    public int Cantidad { get; set; }
    public decimal Precio { get; set; }
    public decimal Subtotal { get; set; }
}