import { describe, expect, it } from 'vitest';
import { shouldAnalyzeDocumentOnSave } from '../../src/application/save-analysis.handler.js';

describe('save-analysis.handler', () => {
  const csharpDocument = {
    languageId: 'csharp',
    uri: { scheme: 'file', toString: () => 'file:///workspace/Product.cs' },
    isDirty: false,
  };

  it('is disabled by default', () => {
    expect(shouldAnalyzeDocumentOnSave(csharpDocument, false)).toBe(false);
  });

  it('analyzes saved csharp documents when enabled', () => {
    expect(shouldAnalyzeDocumentOnSave(csharpDocument, true)).toBe(true);
  });

  it('ignores non-csharp documents', () => {
    expect(
      shouldAnalyzeDocumentOnSave({ ...csharpDocument, languageId: 'typescript' }, true),
    ).toBe(false);
  });

  it('ignores untitled documents', () => {
    expect(
      shouldAnalyzeDocumentOnSave(
        {
          ...csharpDocument,
          uri: { scheme: 'untitled', toString: () => 'untitled:1' },
        },
        true,
      ),
    ).toBe(false);
  });

  it('ignores dirty documents after save event', () => {
    expect(shouldAnalyzeDocumentOnSave({ ...csharpDocument, isDirty: true }, true)).toBe(false);
  });
});
