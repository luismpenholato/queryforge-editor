import { describe, expect, it } from 'vitest';
import { PerDocumentIssueCounts } from '../../src/presentation/status-bar-state.js';

describe('PerDocumentIssueCounts', () => {
  const uriA = 'file:///a.cs';
  const uriB = 'file:///b.cs';

  it('shows per-document counts when switching editors', () => {
    const counts = new PerDocumentIssueCounts();
    counts.setIssueCount(uriA, 3);

    expect(counts.resolveActiveView(uriB, 'csharp')).toEqual({
      state: 'idle',
      issueCount: 0,
      visible: true,
    });

    expect(counts.resolveActiveView(uriA, 'csharp')).toEqual({
      state: 'issues',
      issueCount: 3,
      visible: true,
    });
  });

  it('shows success state for analyzed file with zero issues', () => {
    const counts = new PerDocumentIssueCounts();
    counts.setIssueCount(uriB, 0);

    expect(counts.resolveActiveView(uriB, 'csharp')).toEqual({
      state: 'success',
      issueCount: 0,
      visible: true,
    });
  });

  it('hides status bar for non-csharp editors', () => {
    const counts = new PerDocumentIssueCounts();
    counts.setIssueCount(uriA, 2);

    expect(counts.resolveActiveView(uriA, 'typescript')).toEqual({
      state: 'idle',
      issueCount: 0,
      visible: false,
    });
  });

  it('shows running state for active document', () => {
    const counts = new PerDocumentIssueCounts();
    counts.setAnalyzing(uriA);

    expect(counts.resolveActiveView(uriA, 'csharp')).toEqual({
      state: 'running',
      issueCount: 0,
      visible: true,
    });
  });

  it('clears running state when issue count is set', () => {
    const counts = new PerDocumentIssueCounts();
    counts.setAnalyzing(uriA);
    counts.setIssueCount(uriA, 2);

    expect(counts.resolveActiveView(uriA, 'csharp')).toEqual({
      state: 'issues',
      issueCount: 2,
      visible: true,
    });
  });

  it('returns to idle after clearing issue count', () => {
    const counts = new PerDocumentIssueCounts();
    counts.setIssueCount(uriA, 3);
    counts.setIssueCount(uriB, 1);

    counts.clearIssueCount(uriA);

    expect(counts.hasIssueCount(uriA)).toBe(false);
    expect(counts.getIssueCount(uriB)).toBe(1);
    expect(counts.resolveActiveView(uriA, 'csharp').state).toBe('idle');
    expect(counts.resolveActiveView(uriB, 'csharp').state).toBe('issues');
  });

  it('resets all document counts', () => {
    const counts = new PerDocumentIssueCounts();
    counts.setIssueCount(uriA, 3);
    counts.setIssueCount(uriB, 2);

    counts.reset();

    expect(counts.hasIssueCount(uriA)).toBe(false);
    expect(counts.hasIssueCount(uriB)).toBe(false);
    expect(counts.resolveActiveView(uriA, 'csharp').state).toBe('idle');
  });
});
