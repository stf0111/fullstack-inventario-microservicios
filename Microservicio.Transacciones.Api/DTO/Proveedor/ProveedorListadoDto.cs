namespace Microservicio.Transacciones.Api.DTOs.Proveedor;

public class ProveedorListadoDto
{
    public int ProvId { get; set; }

    public string ProvNombre { get; set; } = null!;

    public string? ProvRuc { get; set; }

    public string? ProvTelefono { get; set; }

    public string? ProvDireccion { get; set; }

    public string? ProvCorreo { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}