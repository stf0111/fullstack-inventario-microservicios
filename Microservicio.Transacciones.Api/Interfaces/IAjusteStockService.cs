using Microservicio.Transacciones.Api.DTOs.AjusteStock;
using Microservicio.Transacciones.Api.DTOs.Shared;

namespace Microservicio.Transacciones.Api.Interfaces;

public interface IAjusteStockService
{
    Task<ApiResponseDto<AjusteStockResponseDto>> AjustarAsync(int prodId, AjusteStockRequestDto dto);
}