import { describe, expect, it } from 'vitest';
import {
  formatDocumentChangedMessage,
  getSafeFixes,
  isDocumentVersionStale,
  shouldOfferFix,
  validateAndMapEdits,
} from '../../src/code-actions/workspace-edit-factory.js';

describe('workspace-edit-factory', () => {
  it('offers only safe fixes', () => {
    const fixes = getSafeFixes([
      { id: '1', title: 'Safe', safety: 'safe', edits: [{ range: { start: 0, end: 1 }, newText: 'x' }] },
      { id: '2', title: 'Review', safety: 'review-required' },
    ]);

    expect(fixes).toHaveLength(1);
    expect(shouldOfferFix(fixes[0]!)).toBe(true);
    expect(shouldOfferFix({ id: '3', title: 'Review', safety: 'review-required' })).toBe(false);
  });

  it('does not offer safeAutoFix without safe safety', () => {
    expect(
      shouldOfferFix({ id: '1', title: 'Unsafe', safety: 'review-required' }),
    ).toBe(false);
  });

  it('maps single edit with selection offset', () => {
    const result = validateAndMapEdits({
      edits: [{ range: { start: 2, end: 5 }, newText: 'Any' }],
      baseOffset: 10,
      analyzedCodeLength: 20,
      documentLength: 100,
    });

    expect(result.valid).toBe(true);
    expect(result.absoluteEdits[0]).toEqual({
      startOffset: 12,
      endOffset: 15,
      newText: 'Any',
    });
  });

  it('maps multiple edits', () => {
    const result = validateAndMapEdits({
      edits: [
        { range: { start: 0, end: 1 }, newText: 'a' },
        { range: { start: 5, end: 6 }, newText: 'b' },
      ],
      baseOffset: 0,
      analyzedCodeLength: 10,
      documentLength: 10,
    });

    expect(result.valid).toBe(true);
    expect(result.absoluteEdits).toHaveLength(2);
  });

  it('rejects overlapping edits', () => {
    const result = validateAndMapEdits({
      edits: [
        { range: { start: 0, end: 5 }, newText: 'a' },
        { range: { start: 3, end: 7 }, newText: 'b' },
      ],
      baseOffset: 0,
      analyzedCodeLength: 10,
      documentLength: 10,
    });

    expect(result.valid).toBe(false);
    expect(result.warning).toContain('overlap');
  });

  it('blocks stale document version', () => {
    expect(
      isDocumentVersionStale({ currentVersion: 2, expectedVersion: 1 }),
    ).toBe(true);
    expect(formatDocumentChangedMessage()).toContain('document changed');
  });
});
