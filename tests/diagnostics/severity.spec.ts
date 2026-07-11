import { describe, expect, it } from 'vitest';
import {
  compareSeverity,
  meetsMinimumSeverity,
  SEVERITY_ORDER,
} from '../../src/diagnostics/severity.js';
import { filterSmellsByMinimumSeverity } from '../../src/diagnostics/diagnostic-mapper.js';

describe('severity', () => {
  it('orders all five levels', () => {
    expect(SEVERITY_ORDER.info).toBeLessThan(SEVERITY_ORDER.low);
    expect(SEVERITY_ORDER.low).toBeLessThan(SEVERITY_ORDER.medium);
    expect(SEVERITY_ORDER.medium).toBeLessThan(SEVERITY_ORDER.high);
    expect(SEVERITY_ORDER.high).toBeLessThan(SEVERITY_ORDER.critical);
  });

  it('compares severities', () => {
    expect(compareSeverity('high', 'medium')).toBeGreaterThan(0);
    expect(compareSeverity('low', 'critical')).toBeLessThan(0);
  });

  it('filters by minimum severity', () => {
    const smells = [
      { code: 'A', title: '', severity: 'info' as const, message: '', suggestion: '', confidence: 1 },
      { code: 'B', title: '', severity: 'medium' as const, message: '', suggestion: '', confidence: 1 },
      { code: 'C', title: '', severity: 'critical' as const, message: '', suggestion: '', confidence: 1 },
    ];

    const filtered = filterSmellsByMinimumSeverity(smells, 'medium');
    expect(filtered.map((item) => item.code)).toEqual(['B', 'C']);
    expect(meetsMinimumSeverity('medium', 'low')).toBe(true);
    expect(meetsMinimumSeverity('low', 'medium')).toBe(false);
  });
});
