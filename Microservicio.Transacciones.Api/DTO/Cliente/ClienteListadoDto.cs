namespace Microservicio.Transacciones.Api.DTOs.Cliente;

public class ClienteListadoDto
{
    public int CliId { get; set; }

    public string? CliCedula { get; set; }

    public string CliNombre { get; set; } = null!;

    public string CliApellido { get; set; } = null!;

    public string CliNombreCompleto { get; set; } = null!;

    public string? CliDireccion { get; set; }

    public string? CliCorreo { get; set; }

    public string? CliTelefono { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}