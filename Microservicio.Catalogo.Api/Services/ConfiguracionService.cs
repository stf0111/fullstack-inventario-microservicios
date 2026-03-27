using Microsoft.EntityFrameworkCore;
using Microservicio.Catalogo.Api.Data;
using Microservicio.Catalogo.Api.DTOs.Configuracion;
using Microservicio.Catalogo.Api.Interfaces;
using Microservicio.Catalogo.Api.Models;

namespace Microservicio.Catalogo.Api.Services;

public class ConfiguracionService : IConfiguracionService
{
    private readonly CatalogoDbContext _context;

    public ConfiguracionService(CatalogoDbContext context)
    {
        _context = context;
    }

    public async Task<ConfiguracionDto?> ObtenerAsync()
    {
        var configuracion = await _context.Configuracions
            .AsNoTracking()
            .Where(c => c.DeletedAt == null)
            .OrderBy(c => c.ConfId)
            .FirstOrDefaultAsync();

        if (configuracion == null)
            return null;

        return new ConfiguracionDto
        {
            ConfId = configuracion.ConfId,
            IvaPorcentaje = configuracion.IvaPorcentaje,
            Establecimiento = configuracion.Establecimiento,
            PuntoEmision = configuracion.PuntoEmision,
            UltimoSecuencial = configuracion.UltimoSecuencial,
            CreatedAt = configuracion.CreatedAt,
            UpdatedAt = configuracion.UpdatedAt
        };
    }

    public async Task<ConfiguracionDto> CrearAsync(ConfiguracionCrearDto dto)
    {
        var existe = await _context.Configuracions
            .AnyAsync(c => c.DeletedAt == null);

        if (existe)
            throw new Exception("Ya existe una configuración registrada. Debe editar la existente.");

        var configuracion = new Configuracion
        {
            IvaPorcentaje = dto.IvaPorcentaje,
            Establecimiento = dto.Establecimiento.Trim(),
            PuntoEmision = dto.PuntoEmision.Trim(),
            UltimoSecuencial = dto.UltimoSecuencial,
            CreatedAt = DateTime.Now
        };

        _context.Configuracions.Add(configuracion);
        await _context.SaveChangesAsync();

        return new ConfiguracionDto
        {
            ConfId = configuracion.ConfId,
            IvaPorcentaje = configuracion.IvaPorcentaje,
            Establecimiento = configuracion.Establecimiento,
            PuntoEmision = configuracion.PuntoEmision,
            UltimoSecuencial = configuracion.UltimoSecuencial,
            CreatedAt = configuracion.CreatedAt,
            UpdatedAt = configuracion.UpdatedAt
        };
    }

    public async Task<bool> EditarAsync(int id, ConfiguracionEditarDto dto)
    {
        var configuracion = await _context.Configuracions
            .FirstOrDefaultAsync(c => c.ConfId == id && c.DeletedAt == null);

        if (configuracion == null)
            return false;

        configuracion.IvaPorcentaje = dto.IvaPorcentaje;
        configuracion.Establecimiento = dto.Establecimiento.Trim();
        configuracion.PuntoEmision = dto.PuntoEmision.Trim();
        configuracion.UltimoSecuencial = dto.UltimoSecuencial;
        configuracion.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return true;
    }
}