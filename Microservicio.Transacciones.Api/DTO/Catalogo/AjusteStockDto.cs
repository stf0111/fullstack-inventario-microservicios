namespace Microservicio.Transacciones.Api.DTOs.Catalogo;

public class AjusteStockDto
{
    public int? Cantidad { get; set; }
    public int? NuevoStock { get; set; }
    public string Operacion { get; set; } = null!;
}