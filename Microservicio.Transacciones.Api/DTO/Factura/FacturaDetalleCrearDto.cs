using System.ComponentModel.DataAnnotations;

namespace Microservicio.Transacciones.Api.DTOs.Factura;

public class FacturaDetalleCrearDto
{
    [Range(1, int.MaxValue, ErrorMessage = "El producto es obligatorio.")]
    public int ProdId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0.")]
    public int Cantidad { get; set; }
}