using System.ComponentModel.DataAnnotations;

namespace Microservicio.Catalogo.Api.DTOs.Producto;

public class ProductoEditarDto
{
    [Required(ErrorMessage = "El nombre del producto es obligatorio.")]
    [StringLength(200, ErrorMessage = "El nombre no puede superar los 200 caracteres.")]
    public string ProdNombre { get; set; } = null!;

    [StringLength(1000, ErrorMessage = "La descripción no puede superar los 1000 caracteres.")]
    public string? ProdDescripcion { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La categoría es obligatoria.")]
    public int CatId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "La marca es obligatoria.")]
    public int MarcaId { get; set; }

    [Range(typeof(decimal), "0,01", "999999999999", ErrorMessage = "El precio de venta debe ser mayor a 0.")]
    public decimal ProdPrecioven { get; set; }

    [Range(typeof(decimal), "0,01", "999999999999", ErrorMessage = "El precio de compra debe ser mayor a 0.")]
    public decimal ProdPreciocom { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "La cantidad no puede ser negativa.")]
    public int ProdCantidad { get; set; }

    public bool ProdEstado { get; set; }
}