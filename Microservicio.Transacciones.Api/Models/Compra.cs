using System;
using System.Collections.Generic;

namespace Microservicio.Transacciones.Api.Models;

public partial class Compra
{
    public int CompraId { get; set; }

    public int ProvId { get; set; }

    public int UsuId { get; set; }

    public DateOnly CompraFecha { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? UpdatedBy { get; set; }

    public int? DeletedBy { get; set; }

    public virtual ICollection<ProductoCompra> ProductoCompras { get; set; } = new List<ProductoCompra>();

    public virtual Proveedor? Prov { get; set; } = null!;
}
