namespace Microservicio.Catalogo.Api.DTOs.Marca;

public class MarcaListadoDto
{
    public int MarcaId { get; set; }

    public string MarcaNombre { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}