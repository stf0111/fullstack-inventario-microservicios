using System.ComponentModel.DataAnnotations;

namespace Microservicio.Transacciones.Api.DTOs.Compra;

public class CompraDetalleCrearDto
{
    [Range(1, int.MaxValue, ErrorMessage = "El producto es obligatorio.")]
    public int ProdId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0.")]
    public int Cantidad { get; set; }

    [Range(typeof(decimal), "0,01", "999999999999", ErrorMessage = "El precio debe ser mayor a 0.")]
    public decimal Precio { get; set; }
}