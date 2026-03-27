using System.ComponentModel.DataAnnotations;

namespace Microservicio.Catalogo.Api.DTOs.Configuracion;

public class ConfiguracionCrearDto
{
    [Range(typeof(decimal), "0", "100", ErrorMessage = "El IVA debe estar entre 0 y 100.")]
    public decimal IvaPorcentaje { get; set; }

    [Required(ErrorMessage = "El establecimiento es obligatorio.")]
    [StringLength(3, ErrorMessage = "El establecimiento no puede superar los 3 caracteres.")]
    public string Establecimiento { get; set; } = null!;

    [Required(ErrorMessage = "El punto de emisión es obligatorio.")]
    [StringLength(3, ErrorMessage = "El punto de emisión no puede superar los 3 caracteres.")]
    public string PuntoEmision { get; set; } = null!;

    [Range(0, int.MaxValue, ErrorMessage = "El último secuencial no puede ser negativo.")]
    public int UltimoSecuencial { get; set; }
}