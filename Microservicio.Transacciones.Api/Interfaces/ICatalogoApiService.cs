using Microservicio.Transacciones.Api.DTOs.Catalogo;

namespace Microservicio.Transacciones.Api.Interfaces;

public interface ICatalogoApiService
{
    Task<ProductoCatalogoDto?> ObtenerProductoAsync(int prodId);
    Task<bool> SumarStockAsync(int prodId, int cantidad);
    Task<bool> RestarStockAsync(int prodId, int cantidad);
}