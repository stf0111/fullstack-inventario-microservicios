using System;
using System.Collections.Generic;
using Microservicio.Catalogo.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Microservicio.Catalogo.Api.Data;

public partial class CatalogoDbContext : DbContext
{
    public CatalogoDbContext()
    {
    }

    public CatalogoDbContext(DbContextOptions<CatalogoDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Categorium> Categoria { get; set; }

    public virtual DbSet<Configuracion> Configuracions { get; set; }

    public virtual DbSet<Imagen> Imagens { get; set; }

    public virtual DbSet<Marca> Marcas { get; set; }

    public virtual DbSet<Producto> Productos { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=localhost,14330;Database=BD_CATALOGO;User Id=sa;Password=TuPasswordSeguro123!;TrustServerCertificate=True;MultipleActiveResultSets=True");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Categorium>(entity =>
        {
            entity.HasKey(e => e.CatId);

            entity.ToTable("CATEGORIA");

            entity.HasIndex(e => e.CatNombre, "UQ_CAT_NOMBRE")
                .IsUnique()
                .HasFilter("([DELETED_AT] IS NULL)");

            entity.Property(e => e.CatId).HasColumnName("CAT_ID");
            entity.Property(e => e.CatNombre)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("CAT_NOMBRE");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.CreatedBy).HasColumnName("CREATED_BY");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("DELETED_AT");
            entity.Property(e => e.DeletedBy).HasColumnName("DELETED_BY");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("UPDATED_AT");
            entity.Property(e => e.UpdatedBy).HasColumnName("UPDATED_BY");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.CategoriumCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_CAT_CREATED_BY");

            entity.HasOne(d => d.DeletedByNavigation).WithMany(p => p.CategoriumDeletedByNavigations)
                .HasForeignKey(d => d.DeletedBy)
                .HasConstraintName("FK_CAT_DELETED_BY");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.CategoriumUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_CAT_UPDATED_BY");
        });

        modelBuilder.Entity<Configuracion>(entity =>
        {
            entity.HasKey(e => e.ConfId);

            entity.ToTable("CONFIGURACION");

            entity.Property(e => e.ConfId).HasColumnName("CONF_ID");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.CreatedBy).HasColumnName("CREATED_BY");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("DELETED_AT");
            entity.Property(e => e.DeletedBy).HasColumnName("DELETED_BY");
            entity.Property(e => e.Establecimiento)
                .HasMaxLength(3)
                .IsUnicode(false)
                .HasDefaultValue("001")
                .HasColumnName("ESTABLECIMIENTO");
            entity.Property(e => e.IvaPorcentaje)
                .HasDefaultValue(1500m)
                .HasColumnType("decimal(5, 2)")
                .HasColumnName("IVA_PORCENTAJE");
            entity.Property(e => e.PuntoEmision)
                .HasMaxLength(3)
                .IsUnicode(false)
                .HasDefaultValue("001")
                .HasColumnName("PUNTO_EMISION");
            entity.Property(e => e.UltimoSecuencial).HasColumnName("ULTIMO_SECUENCIAL");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("UPDATED_AT");
            entity.Property(e => e.UpdatedBy).HasColumnName("UPDATED_BY");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ConfiguracionCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_CONF_CREATED_BY");

            entity.HasOne(d => d.DeletedByNavigation).WithMany(p => p.ConfiguracionDeletedByNavigations)
                .HasForeignKey(d => d.DeletedBy)
                .HasConstraintName("FK_CONF_DELETED_BY");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ConfiguracionUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_CONF_UPDATED_BY");
        });

        modelBuilder.Entity<Imagen>(entity =>
        {
            entity.HasKey(e => e.ImgId);

            entity.ToTable("IMAGEN");

            entity.HasIndex(e => e.ProdId, "IX_IMG_PROD");

            entity.Property(e => e.ImgId).HasColumnName("IMG_ID");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.CreatedBy).HasColumnName("CREATED_BY");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("DELETED_AT");
            entity.Property(e => e.DeletedBy).HasColumnName("DELETED_BY");
            entity.Property(e => e.EsPrincipal).HasColumnName("ES_PRINCIPAL");
            entity.Property(e => e.ImgDescripcion)
                .HasMaxLength(250)
                .IsUnicode(false)
                .HasColumnName("IMG_DESCRIPCION");
            entity.Property(e => e.ImgEstado)
                .HasDefaultValue(true)
                .HasColumnName("IMG_ESTADO");
            entity.Property(e => e.ImgNombre)
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("IMG_NOMBRE");
            entity.Property(e => e.ImgUrl)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("IMG_URL");
            entity.Property(e => e.Orden)
                .HasDefaultValue(1)
                .HasColumnName("ORDEN");
            entity.Property(e => e.ProdId).HasColumnName("PROD_ID");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("UPDATED_AT");
            entity.Property(e => e.UpdatedBy).HasColumnName("UPDATED_BY");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ImagenCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_IMG_CREATED_BY");

            entity.HasOne(d => d.DeletedByNavigation).WithMany(p => p.ImagenDeletedByNavigations)
                .HasForeignKey(d => d.DeletedBy)
                .HasConstraintName("FK_IMG_DELETED_BY");

            entity.HasOne(d => d.Prod).WithMany(p => p.Imagens)
                .HasForeignKey(d => d.ProdId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_IMAGEN_PRODUCTO");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ImagenUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_IMG_UPDATED_BY");
        });

        modelBuilder.Entity<Marca>(entity =>
        {
            entity.ToTable("MARCA");

            entity.HasIndex(e => e.MarcaNombre, "UQ_MARCA_NOMBRE")
                .IsUnique()
                .HasFilter("([DELETED_AT] IS NULL)");

            entity.Property(e => e.MarcaId).HasColumnName("MARCA_ID");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.CreatedBy).HasColumnName("CREATED_BY");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("DELETED_AT");
            entity.Property(e => e.DeletedBy).HasColumnName("DELETED_BY");
            entity.Property(e => e.MarcaNombre)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("MARCA_NOMBRE");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("UPDATED_AT");
            entity.Property(e => e.UpdatedBy).HasColumnName("UPDATED_BY");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.MarcaCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_MARCA_CREATED_BY");

            entity.HasOne(d => d.DeletedByNavigation).WithMany(p => p.MarcaDeletedByNavigations)
                .HasForeignKey(d => d.DeletedBy)
                .HasConstraintName("FK_MARCA_DELETED_BY");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.MarcaUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_MARCA_UPDATED_BY");
        });

        modelBuilder.Entity<Producto>(entity =>
        {
            entity.HasKey(e => e.ProdId);

            entity.ToTable("PRODUCTO");

            entity.HasIndex(e => e.CatId, "IX_PROD_CAT");

            entity.HasIndex(e => e.MarcaId, "IX_PROD_MARCA");

            entity.Property(e => e.ProdId).HasColumnName("PROD_ID");
            entity.Property(e => e.CatId).HasColumnName("CAT_ID");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.CreatedBy).HasColumnName("CREATED_BY");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("DELETED_AT");
            entity.Property(e => e.DeletedBy).HasColumnName("DELETED_BY");
            entity.Property(e => e.MarcaId).HasColumnName("MARCA_ID");
            entity.Property(e => e.ProdCantidad).HasColumnName("PROD_CANTIDAD");
            entity.Property(e => e.ProdDescripcion)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("PROD_DESCRIPCION");
            entity.Property(e => e.ProdEstado)
                .HasDefaultValue(true)
                .HasColumnName("PROD_ESTADO");
            entity.Property(e => e.ProdNombre)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("PROD_NOMBRE");
            entity.Property(e => e.ProdPreciocom)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("PROD_PRECIOCOM");
            entity.Property(e => e.ProdPrecioven)
                .HasColumnType("decimal(10, 2)")
                .HasColumnName("PROD_PRECIOVEN");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("UPDATED_AT");
            entity.Property(e => e.UpdatedBy).HasColumnName("UPDATED_BY");

            entity.HasOne(d => d.Cat).WithMany(p => p.Productos)
                .HasForeignKey(d => d.CatId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PRODUCTO_CATEGORIA");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.ProductoCreatedByNavigations)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_PROD_CREATED_BY");

            entity.HasOne(d => d.DeletedByNavigation).WithMany(p => p.ProductoDeletedByNavigations)
                .HasForeignKey(d => d.DeletedBy)
                .HasConstraintName("FK_PROD_DELETED_BY");

            entity.HasOne(d => d.Marca).WithMany(p => p.Productos)
                .HasForeignKey(d => d.MarcaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_PRODUCTO_MARCA");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.ProductoUpdatedByNavigations)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_PROD_UPDATED_BY");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.UsuId);

            entity.ToTable("USUARIO");

            entity.HasIndex(e => e.UsuCedula, "UQ_USU_CEDULA")
                .IsUnique()
                .HasFilter("([DELETED_AT] IS NULL)");

            entity.Property(e => e.UsuId).HasColumnName("USU_ID");
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysdatetime())")
                .HasColumnName("CREATED_AT");
            entity.Property(e => e.CreatedBy).HasColumnName("CREATED_BY");
            entity.Property(e => e.DeletedAt)
                .HasPrecision(0)
                .HasColumnName("DELETED_AT");
            entity.Property(e => e.DeletedBy).HasColumnName("DELETED_BY");
            entity.Property(e => e.UpdatedAt)
                .HasPrecision(0)
                .HasColumnName("UPDATED_AT");
            entity.Property(e => e.UpdatedBy).HasColumnName("UPDATED_BY");
            entity.Property(e => e.UsuApellido)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("USU_APELLIDO");
            entity.Property(e => e.UsuCedula)
                .HasMaxLength(13)
                .IsUnicode(false)
                .HasColumnName("USU_CEDULA");
            entity.Property(e => e.UsuEstado)
                .HasDefaultValue(true)
                .HasColumnName("USU_ESTADO");
            entity.Property(e => e.UsuNombre)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("USU_NOMBRE");
            entity.Property(e => e.UsuPassword)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("USU_PASSWORD");
            entity.Property(e => e.UsuRol)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("ADMIN")
                .HasColumnName("USU_ROL");

            entity.HasOne(d => d.CreatedByNavigation).WithMany(p => p.InverseCreatedByNavigation)
                .HasForeignKey(d => d.CreatedBy)
                .HasConstraintName("FK_USU_CREATED_BY");

            entity.HasOne(d => d.DeletedByNavigation).WithMany(p => p.InverseDeletedByNavigation)
                .HasForeignKey(d => d.DeletedBy)
                .HasConstraintName("FK_USU_DELETED_BY");

            entity.HasOne(d => d.UpdatedByNavigation).WithMany(p => p.InverseUpdatedByNavigation)
                .HasForeignKey(d => d.UpdatedBy)
                .HasConstraintName("FK_USU_UPDATED_BY");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
