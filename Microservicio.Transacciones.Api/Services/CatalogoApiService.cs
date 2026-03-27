using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Http;
using Microservicio.Transacciones.Api.DTOs.Catalogo;
using Microservicio.Transacciones.Api.DTOs.Shared;
using Microservicio.Transacciones.Api.Interfaces;

namespace Microservicio.Transacciones.Api.Services;

public class CatalogoApiService : ICatalogoApiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CatalogoApiService(IHttpClientFactory httpClientFactory, IHttpContextAccessor httpContextAccessor)
    {
        _httpClientFactory = httpClientFactory;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<ProductoCatalogoDto?> ObtenerProductoAsync(int prodId)
    {
        var client = CrearClienteConToken();

        var response = await client.GetAsync($"/api/Producto/{prodId}");

        if (!response.IsSuccessStatusCode)
            return null;

        var apiResponse = await response.Content.ReadFromJsonAsync<ApiResponseDto<ProductoCatalogoDto>>();

        return apiResponse?.Datos;
    }

    public async Task<bool> SumarStockAsync(int prodId, int cantidad)
    {
        var client = CrearClienteConToken();

        var dto = new AjusteStockDto
        {
            Cantidad = cantidad,
            Operacion = "SUMAR"
        };

        var response = await client.PutAsJsonAsync($"/api/Producto/stock/{prodId}", dto);

        return response.IsSuccessStatusCode;
    }

    public async Task<bool> RestarStockAsync(int prodId, int cantidad)
    {
        var client = CrearClienteConToken();

        var dto = new AjusteStockDto
        {
            Cantidad = cantidad,
            Operacion = "RESTAR"
        };

        var response = await client.PutAsJsonAsync($"/api/Producto/stock/{prodId}", dto);

        return response.IsSuccessStatusCode;
    }

    private HttpClient CrearClienteConToken()
    {
        var client = _httpClientFactory.CreateClient("CatalogoApi");

        var authorizationHeader = _httpContextAccessor.HttpContext?
            .Request.Headers["Authorization"]
            .FirstOrDefault();

        if (!string.IsNullOrWhiteSpace(authorizationHeader))
        {
            client.DefaultRequestHeaders.Authorization =
                AuthenticationHeaderValue.Parse(authorizationHeader);
        }

        return client;
    }
}