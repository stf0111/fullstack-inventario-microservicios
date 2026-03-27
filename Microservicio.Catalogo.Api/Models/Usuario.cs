using System;
using System.Collections.Generic;

namespace Microservicio.Catalogo.Api.Models;

public partial class Usuario
{
    public int UsuId { get; set; }

    public string UsuCedula { get; set; } = null!;

    public string UsuNombre { get; set; } = null!;

    public string UsuApellido { get; set; } = null!;

    public string UsuRol { get; set; } = null!;

    public bool UsuEstado { get; set; }

    public string? UsuPassword { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public int? CreatedBy { get; set; }

    public int? UpdatedBy { get; set; }

    public int? DeletedBy { get; set; }

    public virtual ICollection<Categorium> CategoriumCreatedByNavigations { get; set; } = new List<Categorium>();

    public virtual ICollection<Categorium> CategoriumDeletedByNavigations { get; set; } = new List<Categorium>();

    public virtual ICollection<Categorium> CategoriumUpdatedByNavigations { get; set; } = new List<Categorium>();

    public virtual ICollection<Configuracion> ConfiguracionCreatedByNavigations { get; set; } = new List<Configuracion>();

    public virtual ICollection<Configuracion> ConfiguracionDeletedByNavigations { get; set; } = new List<Configuracion>();

    public virtual ICollection<Configuracion> ConfiguracionUpdatedByNavigations { get; set; } = new List<Configuracion>();

    public virtual Usuario? CreatedByNavigation { get; set; }

    public virtual Usuario? DeletedByNavigation { get; set; }

    public virtual ICollection<Imagen> ImagenCreatedByNavigations { get; set; } = new List<Imagen>();

    public virtual ICollection<Imagen> ImagenDeletedByNavigations { get; set; } = new List<Imagen>();

    public virtual ICollection<Imagen> ImagenUpdatedByNavigations { get; set; } = new List<Imagen>();

    public virtual ICollection<Usuario> InverseCreatedByNavigation { get; set; } = new List<Usuario>();

    public virtual ICollection<Usuario> InverseDeletedByNavigation { get; set; } = new List<Usuario>();

    public virtual ICollection<Usuario> InverseUpdatedByNavigation { get; set; } = new List<Usuario>();

    public virtual ICollection<Marca> MarcaCreatedByNavigations { get; set; } = new List<Marca>();

    public virtual ICollection<Marca> MarcaDeletedByNavigations { get; set; } = new List<Marca>();

    public virtual ICollection<Marca> MarcaUpdatedByNavigations { get; set; } = new List<Marca>();

    public virtual ICollection<Producto> ProductoCreatedByNavigations { get; set; } = new List<Producto>();

    public virtual ICollection<Producto> ProductoDeletedByNavigations { get; set; } = new List<Producto>();

    public virtual ICollection<Producto> ProductoUpdatedByNavigations { get; set; } = new List<Producto>();

    public virtual Usuario? UpdatedByNavigation { get; set; }
}
