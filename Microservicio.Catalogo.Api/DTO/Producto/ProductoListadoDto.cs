namespace Microservicio.Catalogo.Api.DTOs.Producto;

public class ProductoListadoDto
{
    public int ProdId { get; set; }

    public string ProdNombre { get; set; } = null!;

    public string? ProdDescripcion { get; set; }

    public int CatId { get; set; }

    public string? CatNombre { get; set; }

    public int MarcaId { get; set; }

    public string? MarcaNombre { get; set; }

    public decimal ProdPrecioven { get; set; }

    public decimal ProdPreciocom { get; set; }

    public int ProdCantidad { get; set; }

    public bool ProdEstado { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}