using Microsoft.EntityFrameworkCore;
using Microservicio.Catalogo.Api.Data;
using Microservicio.Catalogo.Api.DTOs.Categoria;
using Microservicio.Catalogo.Api.Interfaces;
using Microservicio.Catalogo.Api.Models;

namespace Microservicio.Catalogo.Api.Services;

public class CategoriaService : ICategoriaService
{
    private readonly CatalogoDbContext _context;

    public CategoriaService(CatalogoDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<CategoriaListadoDto> Items, int TotalRegistros)> ListarAsync(CategoriaFiltroDto filtro)
    {
        filtro.Pagina = filtro.Pagina <= 0 ? 1 : filtro.Pagina;
        filtro.RegistrosPorPagina = filtro.RegistrosPorPagina <= 0 ? 10 : filtro.RegistrosPorPagina;

        var query = _context.Categoria
            .AsNoTracking()
            .Where(c => c.DeletedAt == null)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro.Nombre))
        {
            var nombre = filtro.Nombre.Trim();
            query = query.Where(c => c.CatNombre.Contains(nombre));
        }

        var totalRegistros = await query.CountAsync();

        var items = await query
            .OrderByDescending(c => c.CatId)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(c => new CategoriaListadoDto
            {
                CatId = c.CatId,
                CatNombre = c.CatNombre,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();

        return (items, totalRegistros);
    }

    public async Task<CategoriaListadoDto?> ObtenerPorIdAsync(int id)
    {
        var categoria = await _context.Categoria
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CatId == id && c.DeletedAt == null);

        if (categoria == null)
            return null;

        return new CategoriaListadoDto
        {
            CatId = categoria.CatId,
            CatNombre = categoria.CatNombre,
            CreatedAt = categoria.CreatedAt,
            UpdatedAt = categoria.UpdatedAt
        };
    }

    public async Task<CategoriaListadoDto> CrearAsync(CategoriaCrearDto dto)
    {
        var existe = await _context.Categoria
            .AnyAsync(c => c.CatNombre == dto.CatNombre.Trim() && c.DeletedAt == null);

        if (existe)
            throw new Exception("Ya existe una categoría con ese nombre.");

        var categoria = new Categorium
        {
            CatNombre = dto.CatNombre.Trim(),
            CreatedAt = DateTime.Now
        };

        _context.Categoria.Add(categoria);
        await _context.SaveChangesAsync();

        return new CategoriaListadoDto
        {
            CatId = categoria.CatId,
            CatNombre = categoria.CatNombre,
            CreatedAt = categoria.CreatedAt,
            UpdatedAt = categoria.UpdatedAt
        };
    }

    public async Task<bool> EditarAsync(int id, CategoriaEditarDto dto)
    {
        var categoria = await _context.Categoria
            .FirstOrDefaultAsync(c => c.CatId == id && c.DeletedAt == null);

        if (categoria == null)
            return false;

        var nombre = dto.CatNombre.Trim();

        var existe = await _context.Categoria
            .AnyAsync(c => c.CatId != id && c.CatNombre == nombre && c.DeletedAt == null);

        if (existe)
            throw new Exception("Ya existe otra categoría con ese nombre.");

        categoria.CatNombre = nombre;
        categoria.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EliminarAsync(int id, int? deletedBy = null)
    {
        var categoria = await _context.Categoria
            .Include(c => c.Productos)
            .FirstOrDefaultAsync(c => c.CatId == id && c.DeletedAt == null);

        if (categoria == null)
            return false;

        var tieneProductosActivos = categoria.Productos.Any(p => p.DeletedAt == null);

        if (tieneProductosActivos)
            throw new Exception("No se puede eliminar la categoría porque tiene productos asociados.");

        categoria.DeletedAt = DateTime.Now;
        categoria.DeletedBy = deletedBy;
        categoria.UpdatedAt = DateTime.Now;
        categoria.UpdatedBy = deletedBy;

        await _context.SaveChangesAsync();
        return true;
    }
}