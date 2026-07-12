export const PRODUCT_QUERY_SERVICE_EXAMPLE = `using Microsoft.EntityFrameworkCore;

public sealed class ProductQueryService
{
    private readonly AppDbContext _db;

    public ProductQueryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> HasActiveProductsAsync()
    {
        return await _db.Products.CountAsync(product => product.IsActive) > 0;
    }

    public async Task<List<ProductSummary>> SearchAsync(string term)
    {
        return await _db.Products
            .Where(product =>
                product.Name.ToLower().Contains(term.ToLower()) &&
                product.CreatedAt.Year == DateTime.UtcNow.Year)
            .Take(1000)
            .Select(product => new ProductSummary
            {
                Id = product.Id,
                Name = product.Name
            })
            .ToListAsync();
    }
}
`;
