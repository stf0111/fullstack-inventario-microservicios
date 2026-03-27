using System;
using System.Collections.Generic;

namespace Microservicio.Catalogo.Api.Models;

public partial class Configuracion
{
    public int ConfId { get; set; }

    public decimal IvaPorcentaje { get; set; }

    public string Establecimiento { get; set; } = null!;

    public string PuntoEmision { get; set; } = null!;

    public int UltimoSecuencial { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? UpdatedBy { get; set; }

    public int? DeletedBy { get; set; }

    public virtual Usuario? CreatedByNavigation { get; set; }

    public virtual Usuario? DeletedByNavigation { get; set; }

    public virtual Usuario? UpdatedByNavigation { get; set; }
}
