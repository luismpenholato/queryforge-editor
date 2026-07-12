import { describe, expect, it } from 'vitest';
import type { QuerySmell } from '@luispenholato/queryforge-mcp';
import {
  buildAnalysisSummaryLines,
  countSafeFixes,
  countSmellsBySeverity,
  formatSeveritySummary,
} from '../../src/application/analysis-summary.js';

function createSmell(
  overrides: Partial<QuerySmell> & Pick<QuerySmell, 'code' | 'severity'>,
): QuerySmell {
  return {
    title: overrides.title ?? overrides.code,
    message: overrides.message ?? 'message',
    suggestion: overrides.suggestion ?? 'suggestion',
    confidence: overrides.confidence ?? 0.8,
    ...overrides,
  };
}

describe('analysis-summary', () => {
  it('counts smells by severity', () => {
    const counts = countSmellsBySeverity([
      createSmell({ code: 'A', severity: 'high' }),
      createSmell({ code: 'B', severity: 'medium' }),
      createSmell({ code: 'C', severity: 'medium' }),
      createSmell({ code: 'D', severity: 'low' }),
    ]);

    expect(counts).toEqual({
      critical: 0,
      high: 1,
      medium: 2,
      low: 1,
      info: 0,
    });
  });

  it('counts smells with safe fixes', () => {
    const smells = [
      createSmell({
        code: 'COUNT_GREATER_THAN_ZERO',
        severity: 'medium',
        fixes: [{ id: '1', title: 'Use AnyAsync', safety: 'safe', edits: [{ range: { start: 0, end: 1 }, newText: 'x' }] }],
      }),
      createSmell({
        code: 'FUNCTION_ON_COLUMN_FILTER',
        severity: 'high',
        fixes: [{ id: '2', title: 'Review', safety: 'review-required' }],
      }),
    ];

    expect(countSafeFixes(smells)).toBe(1);
  });

  it('formats severity summary line', () => {
    expect(
      formatSeveritySummary({
        critical: 0,
        high: 1,
        medium: 3,
        low: 1,
        info: 0,
      }),
    ).toBe('Info: 0 | Low: 1 | Medium: 3 | High: 1 | Critical: 0');
  });

  it('builds summary lines without code content', () => {
    const lines = buildAnalysisSummaryLines({
      issueCount: 2,
      minimumSeverity: 'info',
      smells: [
        createSmell({ code: 'COUNT_GREATER_THAN_ZERO', severity: 'medium' }),
        createSmell({ code: 'MISSING_AS_NO_TRACKING', severity: 'low' }),
      ],
    });

    expect(lines).toEqual([
      'Found 2 potential issues.',
      'Info: 0 | Low: 1 | Medium: 1 | High: 0 | Critical: 0',
      'Safe fixes available: 0',
    ]);

    for (const line of lines) {
      expect(line).not.toContain('CountAsync');
      expect(line).not.toContain('file://');
    }
  });

  it('omits severity and safe-fix lines when there are zero issues', () => {
    expect(
      buildAnalysisSummaryLines({
        issueCount: 0,
        minimumSeverity: 'info',
        smells: [],
      }),
    ).toEqual(['Found 0 potential issues.']);
  });
});
