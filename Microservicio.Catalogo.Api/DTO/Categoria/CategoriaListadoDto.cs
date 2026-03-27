namespace Microservicio.Catalogo.Api.DTOs.Categoria;

public class CategoriaListadoDto
{
    public int CatId { get; set; }

    public string CatNombre { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}