using System.ComponentModel.DataAnnotations;

namespace Microservicio.Catalogo.Api.DTOs.Producto;

public class ProductoAjustarStockDto
{
    public int? Cantidad { get; set; }

    public int? NuevoStock { get; set; }

    [Required(ErrorMessage = "La operación es obligatoria.")]
    public string Operacion { get; set; } = null!;
}