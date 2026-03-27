using System.ComponentModel.DataAnnotations;

namespace Microservicio.Transacciones.Api.DTOs.Compra;

public class CompraCrearDto
{
    [Range(1, int.MaxValue, ErrorMessage = "El proveedor es obligatorio.")]
    public int ProvId { get; set; }

    public DateOnly? CompraFecha { get; set; }

    [Required(ErrorMessage = "Debe enviar al menos un detalle.")]
    [MinLength(1, ErrorMessage = "Debe enviar al menos un detalle.")]
    public List<CompraDetalleCrearDto> Detalles { get; set; } = new();
}