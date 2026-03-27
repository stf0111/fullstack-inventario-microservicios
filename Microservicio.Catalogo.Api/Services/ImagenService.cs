using Microsoft.EntityFrameworkCore;
using Microservicio.Catalogo.Api.Data;
using Microservicio.Catalogo.Api.DTOs.Imagen;
using Microservicio.Catalogo.Api.Interfaces;
using Microservicio.Catalogo.Api.Models;

namespace Microservicio.Catalogo.Api.Services;

public class ImagenService : IImagenService
{
    private readonly CatalogoDbContext _context;

    public ImagenService(CatalogoDbContext context)
    {
        _context = context;
    }

    public async Task<(IEnumerable<ImagenListadoDto> Items, int TotalRegistros)> ListarAsync(ImagenFiltroDto filtro)
    {
        filtro.Pagina = filtro.Pagina <= 0 ? 1 : filtro.Pagina;
        filtro.RegistrosPorPagina = filtro.RegistrosPorPagina <= 0 ? 10 : filtro.RegistrosPorPagina;

        var query = _context.Imagens
            .AsNoTracking()
            .Include(i => i.Prod)
            .Where(i => i.DeletedAt == null)
            .AsQueryable();

        if (filtro.ProdId.HasValue)
        {
            query = query.Where(i => i.ProdId == filtro.ProdId.Value);
        }

        if (filtro.EsPrincipal.HasValue)
        {
            query = query.Where(i => i.EsPrincipal == filtro.EsPrincipal.Value);
        }

        if (filtro.ImgEstado.HasValue)
        {
            query = query.Where(i => i.ImgEstado == filtro.ImgEstado.Value);
        }

        var totalRegistros = await query.CountAsync();

        var items = await query
            .OrderBy(i => i.Orden)
            .ThenByDescending(i => i.ImgId)
            .Skip((filtro.Pagina - 1) * filtro.RegistrosPorPagina)
            .Take(filtro.RegistrosPorPagina)
            .Select(i => new ImagenListadoDto
            {
                ImgId = i.ImgId,
                ProdId = i.ProdId,
                ProdNombre = i.Prod != null ? i.Prod.ProdNombre : null,
                ImgNombre = i.ImgNombre,
                ImgUrl = i.ImgUrl,
                ImgDescripcion = i.ImgDescripcion,
                EsPrincipal = i.EsPrincipal,
                Orden = i.Orden,
                ImgEstado = i.ImgEstado,
                CreatedAt = i.CreatedAt,
                UpdatedAt = i.UpdatedAt
            })
            .ToListAsync();

        return (items, totalRegistros);
    }

    public async Task<ImagenListadoDto?> ObtenerPorIdAsync(int id)
    {
        var imagen = await _context.Imagens
            .AsNoTracking()
            .Include(i => i.Prod)
            .FirstOrDefaultAsync(i => i.ImgId == id && i.DeletedAt == null);

        if (imagen == null)
            return null;

        return new ImagenListadoDto
        {
            ImgId = imagen.ImgId,
            ProdId = imagen.ProdId,
            ProdNombre = imagen.Prod != null ? imagen.Prod.ProdNombre : null,
            ImgNombre = imagen.ImgNombre,
            ImgUrl = imagen.ImgUrl,
            ImgDescripcion = imagen.ImgDescripcion,
            EsPrincipal = imagen.EsPrincipal,
            Orden = imagen.Orden,
            ImgEstado = imagen.ImgEstado,
            CreatedAt = imagen.CreatedAt,
            UpdatedAt = imagen.UpdatedAt
        };
    }

    public async Task<ImagenListadoDto> CrearAsync(ImagenCrearDto dto)
    {
        var productoExiste = await _context.Productos
            .AnyAsync(p => p.ProdId == dto.ProdId && p.DeletedAt == null);

        if (!productoExiste)
            throw new Exception("El producto seleccionado no existe.");

        if (dto.EsPrincipal)
        {
            var imagenesPrincipales = await _context.Imagens
                .Where(i => i.ProdId == dto.ProdId && i.DeletedAt == null && i.EsPrincipal)
                .ToListAsync();

            foreach (var item in imagenesPrincipales)
            {
                item.EsPrincipal = false;
                item.UpdatedAt = DateTime.Now;
            }
        }

        var imagen = new Imagen
        {
            ProdId = dto.ProdId,
            ImgNombre = string.IsNullOrWhiteSpace(dto.ImgNombre) ? null : dto.ImgNombre.Trim(),
            ImgUrl = dto.ImgUrl.Trim(),
            ImgDescripcion = string.IsNullOrWhiteSpace(dto.ImgDescripcion) ? null : dto.ImgDescripcion.Trim(),
            EsPrincipal = dto.EsPrincipal,
            Orden = dto.Orden,
            ImgEstado = dto.ImgEstado,
            CreatedAt = DateTime.Now
        };

        _context.Imagens.Add(imagen);
        await _context.SaveChangesAsync();

        var imagenCreada = await _context.Imagens
            .AsNoTracking()
            .Include(i => i.Prod)
            .FirstAsync(i => i.ImgId == imagen.ImgId);

        return new ImagenListadoDto
        {
            ImgId = imagenCreada.ImgId,
            ProdId = imagenCreada.ProdId,
            ProdNombre = imagenCreada.Prod != null ? imagenCreada.Prod.ProdNombre : null,
            ImgNombre = imagenCreada.ImgNombre,
            ImgUrl = imagenCreada.ImgUrl,
            ImgDescripcion = imagenCreada.ImgDescripcion,
            EsPrincipal = imagenCreada.EsPrincipal,
            Orden = imagenCreada.Orden,
            ImgEstado = imagenCreada.ImgEstado,
            CreatedAt = imagenCreada.CreatedAt,
            UpdatedAt = imagenCreada.UpdatedAt
        };
    }

    public async Task<bool> EditarAsync(int id, ImagenEditarDto dto)
    {
        var imagen = await _context.Imagens
            .FirstOrDefaultAsync(i => i.ImgId == id && i.DeletedAt == null);

        if (imagen == null)
            return false;

        var productoExiste = await _context.Productos
            .AnyAsync(p => p.ProdId == dto.ProdId && p.DeletedAt == null);

        if (!productoExiste)
            throw new Exception("El producto seleccionado no existe.");

        if (dto.EsPrincipal)
        {
            var otrasImagenesPrincipales = await _context.Imagens
                .Where(i => i.ProdId == dto.ProdId && i.ImgId != id && i.DeletedAt == null && i.EsPrincipal)
                .ToListAsync();

            foreach (var item in otrasImagenesPrincipales)
            {
                item.EsPrincipal = false;
                item.UpdatedAt = DateTime.Now;
            }
        }

        imagen.ProdId = dto.ProdId;
        imagen.ImgNombre = string.IsNullOrWhiteSpace(dto.ImgNombre) ? null : dto.ImgNombre.Trim();
        imagen.ImgUrl = dto.ImgUrl.Trim();
        imagen.ImgDescripcion = string.IsNullOrWhiteSpace(dto.ImgDescripcion) ? null : dto.ImgDescripcion.Trim();
        imagen.EsPrincipal = dto.EsPrincipal;
        imagen.Orden = dto.Orden;
        imagen.ImgEstado = dto.ImgEstado;
        imagen.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EliminarAsync(int id, int? deletedBy = null)
    {
        var imagen = await _context.Imagens
            .FirstOrDefaultAsync(i => i.ImgId == id && i.DeletedAt == null);

        if (imagen == null)
            return false;

        imagen.DeletedAt = DateTime.Now;
        imagen.DeletedBy = deletedBy;
        imagen.ImgEstado = false;
        imagen.UpdatedAt = DateTime.Now;
        imagen.UpdatedBy = deletedBy;

        await _context.SaveChangesAsync();
        return true;
    }
}