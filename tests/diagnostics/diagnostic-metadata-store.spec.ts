import { describe, expect, it } from 'vitest';
import { DiagnosticMetadataStore } from '../../src/diagnostics/diagnostic-metadata-store.js';
import { buildDiagnosticKey } from '../../src/diagnostics/diagnostic-mapper.js';

const smell = {
  code: 'COUNT_GREATER_THAN_ZERO',
  title: 'Count',
  severity: 'medium' as const,
  message: 'message',
  suggestion: 'suggestion',
  confidence: 0.9,
  fingerprint: 'fp-1',
};

describe('DiagnosticMetadataStore', () => {
  it('replaces metadata by uri', () => {
    const store = new DiagnosticMetadataStore();
    const uri = 'file:///test.cs';
    const key = buildDiagnosticKey(uri, 1, 5, smell.code, smell.fingerprint);

    store.replaceForUri(uri, [
      {
        smell,
        analysisKind: 'document',
        baseOffset: 0,
        analyzedCodeLength: 100,
        documentVersion: 1,
        key,
      },
    ]);

    expect(store.size()).toBe(1);
    store.replaceForUri(uri, []);
    expect(store.size()).toBe(0);
  });

  it('clears by uri', () => {
    const store = new DiagnosticMetadataStore();
    const uriA = 'file:///a.cs';
    const uriB = 'file:///b.cs';

    store.replaceForUri(uriA, [
      {
        smell,
        analysisKind: 'document',
        baseOffset: 0,
        analyzedCodeLength: 10,
        documentVersion: 1,
        key: buildDiagnosticKey(uriA, 0, 5, smell.code),
      },
    ]);
    store.replaceForUri(uriB, [
      {
        smell,
        analysisKind: 'document',
        baseOffset: 0,
        analyzedCodeLength: 10,
        documentVersion: 1,
        key: buildDiagnosticKey(uriB, 0, 5, smell.code),
      },
    ]);

    store.clearByUri(uriA);
    expect(store.getAllForUri(uriA)).toHaveLength(0);
    expect(store.getAllForUri(uriB)).toHaveLength(1);
  });

  it('clears globally', () => {
    const store = new DiagnosticMetadataStore();
    store.replaceForUri('file:///a.cs', [
      {
        smell,
        analysisKind: 'document',
        baseOffset: 0,
        analyzedCodeLength: 10,
        documentVersion: 1,
        key: buildDiagnosticKey('file:///a.cs', 0, 5, smell.code),
      },
    ]);

    store.clearAll();
    expect(store.size()).toBe(0);
  });

  it('does not duplicate the same key', () => {
    const store = new DiagnosticMetadataStore();
    const uri = 'file:///a.cs';
    const key = buildDiagnosticKey(uri, 0, 5, smell.code);

    store.replaceForUri(uri, [
      {
        smell,
        analysisKind: 'document',
        baseOffset: 0,
        analyzedCodeLength: 10,
        documentVersion: 1,
        key,
      },
    ]);

    store.replaceForUri(uri, [
      {
        smell,
        analysisKind: 'document',
        baseOffset: 0,
        analyzedCodeLength: 10,
        documentVersion: 1,
        key,
      },
    ]);

    expect(store.size()).toBe(1);
  });
});
