namespace Microservicio.Transacciones.Api.DTOs.AjusteStock;

public class AjusteStockResponseDto
{
    public int ProdId { get; set; }
    public string ProdNombre { get; set; } = null!;
    public int StockAnterior { get; set; }
    public int NuevoStock { get; set; }
    public int Diferencia { get; set; }
    public string OperacionAplicada { get; set; } = null!;
    public int? KardexId { get; set; }
}