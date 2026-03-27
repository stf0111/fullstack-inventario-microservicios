using Microsoft.EntityFrameworkCore;
using Microservicio.Catalogo.Api.Data;
using Microservicio.Catalogo.Api.DTOs.Producto;
using Microservicio.Catalogo.Api.Interfaces;
using Microservicio.Catalogo.Api.Models;

namespace Microservicio.Catalogo.Api.Services;

public class ProductoService : IProductoService
{
    private readonly CatalogoDbContext _context;

    public ProductoService(CatalogoDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<ProductoListadoDto> Items, int TotalRegistros)> ListarAsync(ProductoFiltroDto filtro)
    {
        filtro.Pagina = filtro.Pagina <= 0 ? 1 : filtro.Pagina;
        filtro.RegistrosPorPagina = filtro.RegistrosPorPagina <= 0 ? 10 : filtro.RegistrosPorPagina;

        var query = _context.Productos
            .AsNoTracking()
            .Include(p => p.Cat)
            .Include(p => p.Marca)
            .Where(p => p.DeletedAt == null)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro.Nombre))
        {
            var nombre = filtro.Nombre.Trim();
            query = query.Where(p => p.ProdNombre.Contains(nombre));
        }

        if (filtro.CatId.HasValue)
        {
            query = query.Where(p => p.CatId == filtro.CatId.Value);
        }

        if (filtro.MarcaId.HasValue)
        {
            query = query.Where(p => p.MarcaId == filtro.MarcaId.Value);
        }

        if (filtro.ProdEstado.HasValue)
        {
            query = query.Where(p => p.ProdEstado == filtro.ProdEstado.Value);
        }

        if (filtro.PrecioMin.HasValue)
        {
            query = query.Where(p => p.ProdPrecioven >= filtro.PrecioMin.Value);
        }

        if (filtro.PrecioMax.HasValue)
        {
            query = query.Where(p => p.ProdPrecioven <= filtro.PrecioMax.Value);
        }

        var totalRegistros = await query.CountAsync();

        var items = await query
            .OrderByDescending(p => p.ProdId)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(p => new ProductoListadoDto
            {
                ProdId = p.ProdId,
                ProdNombre = p.ProdNombre,
                ProdDescripcion = p.ProdDescripcion,
                CatId = p.CatId,
                CatNombre = p.Cat != null ? p.Cat.CatNombre : null,
                MarcaId = p.MarcaId,
                MarcaNombre = p.Marca != null ? p.Marca.MarcaNombre : null,
                ProdPrecioven = p.ProdPrecioven,
                ProdPreciocom = p.ProdPreciocom,
                ProdCantidad = p.ProdCantidad,
                ProdEstado = p.ProdEstado,
                CreatedAt = p.CreatedAt,
                UpdatedAt = p.UpdatedAt
            })
            .ToListAsync();

        return (items, totalRegistros);
    }

    public async Task<ProductoListadoDto?> ObtenerPorIdAsync(int id)
    {
        var producto = await _context.Productos
            .AsNoTracking()
            .Include(p => p.Cat)
            .Include(p => p.Marca)
            .FirstOrDefaultAsync(p => p.ProdId == id && p.DeletedAt == null);

        if (producto == null)
            return null;

        return new ProductoListadoDto
        {
            ProdId = producto.ProdId,
            ProdNombre = producto.ProdNombre,
            ProdDescripcion = producto.ProdDescripcion,
            CatId = producto.CatId,
            CatNombre = producto.Cat != null ? producto.Cat.CatNombre : null,
            MarcaId = producto.MarcaId,
            MarcaNombre = producto.Marca != null ? producto.Marca.MarcaNombre : null,
            ProdPrecioven = producto.ProdPrecioven,
            ProdPreciocom = producto.ProdPreciocom,
            ProdCantidad = producto.ProdCantidad,
            ProdEstado = producto.ProdEstado,
            CreatedAt = producto.CreatedAt,
            UpdatedAt = producto.UpdatedAt
        };
    }

    public async Task<ProductoListadoDto> CrearAsync(ProductoCrearDto dto)
    {
        var categoriaExiste = await _context.Categoria
            .AnyAsync(c => c.CatId == dto.CatId && c.DeletedAt == null);

        if (!categoriaExiste)
            throw new Exception("La categoría seleccionada no existe.");

        var marcaExiste = await _context.Marcas
            .AnyAsync(m => m.MarcaId == dto.MarcaId && m.DeletedAt == null);

        if (!marcaExiste)
            throw new Exception("La marca seleccionada no existe.");

        var producto = new Producto
        {
            ProdNombre = dto.ProdNombre.Trim(),
            ProdDescripcion = string.IsNullOrWhiteSpace(dto.ProdDescripcion) ? null : dto.ProdDescripcion.Trim(),
            CatId = dto.CatId,
            MarcaId = dto.MarcaId,
            ProdPrecioven = dto.ProdPrecioven,
            ProdPreciocom = dto.ProdPreciocom,
            ProdCantidad = dto.ProdCantidad,
            ProdEstado = dto.ProdEstado,
            CreatedAt = DateTime.Now
        };

        _context.Productos.Add(producto);
        await _context.SaveChangesAsync();

        var productoCreado = await _context.Productos
            .AsNoTracking()
            .Include(p => p.Cat)
            .Include(p => p.Marca)
            .FirstAsync(p => p.ProdId == producto.ProdId);

        return new ProductoListadoDto
        {
            ProdId = productoCreado.ProdId,
            ProdNombre = productoCreado.ProdNombre,
            ProdDescripcion = productoCreado.ProdDescripcion,
            CatId = productoCreado.CatId,
            CatNombre = productoCreado.Cat != null ? productoCreado.Cat.CatNombre : null,
            MarcaId = productoCreado.MarcaId,
            MarcaNombre = productoCreado.Marca != null ? productoCreado.Marca.MarcaNombre : null,
            ProdPrecioven = productoCreado.ProdPrecioven,
            ProdPreciocom = productoCreado.ProdPreciocom,
            ProdCantidad = productoCreado.ProdCantidad,
            ProdEstado = productoCreado.ProdEstado,
            CreatedAt = productoCreado.CreatedAt,
            UpdatedAt = productoCreado.UpdatedAt
        };
    }

    public async Task<bool> EditarAsync(int id, ProductoEditarDto dto)
    {
        var producto = await _context.Productos
            .FirstOrDefaultAsync(p => p.ProdId == id && p.DeletedAt == null);

        if (producto == null)
            return false;

        var categoriaExiste = await _context.Categoria
            .AnyAsync(c => c.CatId == dto.CatId && c.DeletedAt == null);

        if (!categoriaExiste)
            throw new Exception("La categoría seleccionada no existe.");

        var marcaExiste = await _context.Marcas
            .AnyAsync(m => m.MarcaId == dto.MarcaId && m.DeletedAt == null);

        if (!marcaExiste)
            throw new Exception("La marca seleccionada no existe.");

        producto.ProdNombre = dto.ProdNombre.Trim();
        producto.ProdDescripcion = string.IsNullOrWhiteSpace(dto.ProdDescripcion) ? null : dto.ProdDescripcion.Trim();
        producto.CatId = dto.CatId;
        producto.MarcaId = dto.MarcaId;
        producto.ProdPrecioven = dto.ProdPrecioven;
        producto.ProdPreciocom = dto.ProdPreciocom;
        producto.ProdCantidad = dto.ProdCantidad;
        producto.ProdEstado = dto.ProdEstado;
        producto.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EliminarAsync(int id, int? deletedBy = null)
    {
        var producto = await _context.Productos
            .FirstOrDefaultAsync(p => p.ProdId == id && p.DeletedAt == null);

        if (producto == null)
            return false;

        producto.DeletedAt = DateTime.Now;
        producto.DeletedBy = deletedBy;
        producto.ProdEstado = false;
        producto.UpdatedAt = DateTime.Now;
        producto.UpdatedBy = deletedBy;

        await _context.SaveChangesAsync();
        return true;
    }


    public async Task<bool> AjustarStockAsync(int id, ProductoAjustarStockDto dto, int? updatedBy = null)
    {
        var producto = await _context.Productos
            .FirstOrDefaultAsync(p => p.ProdId == id && p.DeletedAt == null);

        if (producto == null)
            return false;

        if (!producto.ProdEstado)
            throw new Exception("El producto está inactivo.");

        var operacion = dto.Operacion.Trim().ToUpperInvariant();

        if (operacion != "SUMAR" && operacion != "RESTAR" && operacion != "AJUSTAR")
            throw new Exception("La operación no es válida. Use SUMAR, RESTAR o AJUSTAR.");

        if (operacion == "SUMAR")
        {
            if (!dto.Cantidad.HasValue || dto.Cantidad.Value <= 0)
                throw new Exception("La cantidad para sumar debe ser mayor a 0.");

            producto.ProdCantidad += dto.Cantidad.Value;
        }
        else if (operacion == "RESTAR")
        {
            if (!dto.Cantidad.HasValue || dto.Cantidad.Value <= 0)
                throw new Exception("La cantidad para restar debe ser mayor a 0.");

            if (producto.ProdCantidad < dto.Cantidad.Value)
                throw new Exception("Stock insuficiente para realizar la operación.");

            producto.ProdCantidad -= dto.Cantidad.Value;
        }
        else if (operacion == "AJUSTAR")
        {
            if (!dto.NuevoStock.HasValue || dto.NuevoStock.Value < 0)
                throw new Exception("El nuevo stock debe ser mayor o igual a 0.");

            producto.ProdCantidad = dto.NuevoStock.Value;
        }

        producto.UpdatedAt = DateTime.Now;
        producto.UpdatedBy = updatedBy;

        await _context.SaveChangesAsync();
        return true;
    }
}