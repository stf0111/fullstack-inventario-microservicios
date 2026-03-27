using System;
using System.Collections.Generic;

namespace Microservicio.Transacciones.Api.Models;

public partial class Proveedor
{
    public int ProvId { get; set; }

    public string ProvNombre { get; set; } = null!;

    public string? ProvRuc { get; set; }

    public string? ProvTelefono { get; set; }

    public string? ProvDireccion { get; set; }

    public string? ProvCorreo { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? UpdatedBy { get; set; }

    public int? DeletedBy { get; set; }

    public virtual ICollection<Compra> Compras { get; set; } = new List<Compra>();
}
