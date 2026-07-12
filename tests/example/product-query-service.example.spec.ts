import { describe, expect, it } from 'vitest';
import { QueryAnalysisService } from '@luispenholato/queryforge-mcp';
import { PRODUCT_QUERY_SERVICE_EXAMPLE } from '../../src/example/product-query-service.example.js';

describe('product-query-service example', () => {
  it('contains analyzable query patterns', () => {
    expect(PRODUCT_QUERY_SERVICE_EXAMPLE).toContain('CountAsync');
    expect(PRODUCT_QUERY_SERVICE_EXAMPLE).toContain('ToLower().Contains');
    expect(PRODUCT_QUERY_SERVICE_EXAMPLE).toContain('CreatedAt.Year');
    expect(PRODUCT_QUERY_SERVICE_EXAMPLE).toContain('Take(1000)');
    expect(PRODUCT_QUERY_SERVICE_EXAMPLE).toContain('ToListAsync');
  });

  it('produces expected rule families from the core analyzer', () => {
    const result = new QueryAnalysisService().analyze({
      code: PRODUCT_QUERY_SERVICE_EXAMPLE,
      provider: 'ef-core',
      languageId: 'csharp',
    });

    const codes = new Set(result.smells.map((smell) => smell.code));

    expect(codes.has('COUNT_GREATER_THAN_ZERO')).toBe(true);
    expect(codes.has('MISSING_AS_NO_TRACKING')).toBe(true);
    expect(
      codes.has('FUNCTION_ON_COLUMN_FILTER') ||
        codes.has('STRING_TRANSFORM_ON_COLUMN_FILTER') ||
        codes.has('CONTAINS_ON_STRING_COLUMN'),
    ).toBe(true);
    expect(
      codes.has('LARGE_TAKE') ||
        codes.has('LARGE_TAKE_WITH_ORDER_BY') ||
        codes.has('PAGINATION_WITHOUT_ORDER_BY'),
    ).toBe(true);
  });

  it('includes at least one safe fix from the core', () => {
    const result = new QueryAnalysisService().analyze({
      code: PRODUCT_QUERY_SERVICE_EXAMPLE,
      provider: 'ef-core',
      languageId: 'csharp',
    });

    const safeFixCount = result.smells.filter((smell) =>
      smell.fixes?.some((fix) => fix.safety === 'safe' && fix.edits?.length),
    ).length;

    expect(safeFixCount).toBeGreaterThan(0);
  });
});
