using System.ComponentModel.DataAnnotations;

namespace Microservicio.Transacciones.Api.DTOs.Cliente;

public class ClienteEditarDto
{
    [StringLength(13, ErrorMessage = "La cédula no puede superar los 13 caracteres.")]
    public string? CliCedula { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(50, ErrorMessage = "El nombre no puede superar los 50 caracteres.")]
    public string CliNombre { get; set; } = null!;

    [Required(ErrorMessage = "El apellido es obligatorio.")]
    [StringLength(50, ErrorMessage = "El apellido no puede superar los 50 caracteres.")]
    public string CliApellido { get; set; } = null!;

    [StringLength(100, ErrorMessage = "La dirección no puede superar los 100 caracteres.")]
    public string? CliDireccion { get; set; }

    [StringLength(250, ErrorMessage = "El correo no puede superar los 250 caracteres.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
    public string? CliCorreo { get; set; }

    [StringLength(10, ErrorMessage = "El teléfono no puede superar los 10 caracteres.")]
    public string? CliTelefono { get; set; }
}