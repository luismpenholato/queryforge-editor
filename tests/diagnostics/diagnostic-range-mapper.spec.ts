import { describe, expect, it } from 'vitest';
import { mapDiagnosticRange } from '../../src/diagnostics/diagnostic-range-mapper.js';
import { createFakeDocument } from '../support/fakes.js';

describe('diagnostic-range-mapper', () => {
  it('maps valid document range', () => {
    const document = createFakeDocument('var count = items.Count();');
    const result = mapDiagnosticRange(document, {
      analyzedCode: document.getText(),
      baseOffset: 0,
      analysisKind: 'document',
      smellCode: 'COUNT',
      range: { start: 4, end: 9 },
    });

    expect(result.result.valid).toBe(true);
    expect(result.result.startOffset).toBe(4);
    expect(result.result.endOffset).toBe(9);
  });

  it('maps selection range with base offset', () => {
    const document = createFakeDocument('prefix selected suffix');
    const result = mapDiagnosticRange(document, {
      analyzedCode: 'selected',
      baseOffset: 7,
      analysisKind: 'selection',
      smellCode: 'SEL',
      range: { start: 0, end: 8 },
    });

    expect(result.result.startOffset).toBe(7);
    expect(result.result.endOffset).toBe(15);
  });

  it('handles \\n line endings', () => {
    const document = createFakeDocument('line1\nline2');
    const result = mapDiagnosticRange(document, {
      analyzedCode: document.getText(),
      baseOffset: 0,
      analysisKind: 'document',
      smellCode: 'LF',
      range: { start: 6, end: 11 },
    });

    expect(result.result.valid).toBe(true);
  });

  it('handles \\r\\n line endings', () => {
    const document = createFakeDocument('line1\r\nline2');
    const result = mapDiagnosticRange(document, {
      analyzedCode: document.getText(),
      baseOffset: 0,
      analysisKind: 'document',
      smellCode: 'CRLF',
      range: { start: 7, end: 12 },
    });

    expect(result.result.valid).toBe(true);
  });

  it('uses first non-empty line fallback for invalid document range', () => {
    const document = createFakeDocument('\n\n  query.Count();\n');
    const result = mapDiagnosticRange(document, {
      analyzedCode: document.getText(),
      baseOffset: 0,
      analysisKind: 'document',
      smellCode: 'INVALID',
      range: { start: 100, end: 200 },
    });

    expect(result.result.valid).toBe(false);
    expect(result.warning).toBeDefined();
    expect(result.result.endOffset).toBeLessThanOrEqual(document.getText().length);
    expect(result.result.endOffset - result.result.startOffset).toBeLessThan(document.getText().length);
  });

  it('uses selection fallback when range is missing', () => {
    const document = createFakeDocument('prefix selected suffix');
    const result = mapDiagnosticRange(document, {
      analyzedCode: 'selected',
      baseOffset: 7,
      analysisKind: 'selection',
      smellCode: 'MISSING',
    });

    expect(result.result.startOffset).toBe(7);
    expect(result.result.endOffset).toBe(15);
    expect(result.result.valid).toBe(false);
  });
});
