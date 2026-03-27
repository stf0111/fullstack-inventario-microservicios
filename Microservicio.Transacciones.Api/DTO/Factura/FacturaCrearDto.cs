using System.ComponentModel.DataAnnotations;

namespace Microservicio.Transacciones.Api.DTOs.Factura;

public class FacturaCrearDto
{
    [Range(1, int.MaxValue, ErrorMessage = "El cliente es obligatorio.")]
    public int CliId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "El tipo de pago es obligatorio.")]
    public int TpaId { get; set; }

    public DateOnly? FacFecha { get; set; }

    [Required(ErrorMessage = "Debe enviar al menos un detalle.")]
    [MinLength(1, ErrorMessage = "Debe enviar al menos un detalle.")]
    public List<FacturaDetalleCrearDto> Detalles { get; set; } = new();
}