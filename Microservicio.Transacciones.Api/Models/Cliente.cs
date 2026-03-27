using System;
using System.Collections.Generic;

namespace Microservicio.Transacciones.Api.Models;

public partial class Cliente
{
    public int CliId { get; set; }

    public string? CliCedula { get; set; }

    public string CliNombre { get; set; } = null!;

    public string CliApellido { get; set; } = null!;

    public string? CliDireccion { get; set; }

    public string? CliCorreo { get; set; }

    public string? CliTelefono { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? UpdatedBy { get; set; }

    public int? DeletedBy { get; set; }

    public virtual ICollection<Factura> Facturas { get; set; } = new List<Factura>();
}
