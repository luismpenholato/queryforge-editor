import { describe, expect, it } from 'vitest';
import { mapSmellSeverity, mapSmellToDiagnostic } from '../../src/diagnostics/diagnostic-mapper.js';

describe('diagnostic-mapper', () => {
  it('maps all severity levels', () => {
    expect(mapSmellSeverity('critical')).toBe('error');
    expect(mapSmellSeverity('high')).toBe('error');
    expect(mapSmellSeverity('medium')).toBe('warning');
    expect(mapSmellSeverity('low')).toBe('information');
    expect(mapSmellSeverity('info')).toBe('hint');
  });

  it('maps smell to diagnostic payload', () => {
    const mapped = mapSmellToDiagnostic(
      {
        code: 'COUNT_GREATER_THAN_ZERO',
        title: 'Count',
        severity: 'medium',
        message: 'Use Any instead.',
        suggestion: 'Replace Count with Any.',
        confidence: 0.95,
      },
      10,
      20,
      true,
    );

    expect(mapped.source).toBe('QueryForge');
    expect(mapped.code).toBe('COUNT_GREATER_THAN_ZERO');
    expect(mapped.message).toBe('Use Any instead.');
    expect(mapped.rangeValid).toBe(true);
  });
});
