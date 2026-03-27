using System;
using System.Collections.Generic;

namespace Microservicio.Catalogo.Api.Models;

public partial class Marca
{
    public int MarcaId { get; set; }

    public string MarcaNombre { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? UpdatedBy { get; set; }

    public int? DeletedBy { get; set; }

    public virtual Usuario? CreatedByNavigation { get; set; }

    public virtual Usuario? DeletedByNavigation { get; set; }

    public virtual ICollection<Producto> Productos { get; set; } = new List<Producto>();

    public virtual Usuario? UpdatedByNavigation { get; set; }
}
