import { describe, expect, it, vi } from 'vitest';
import {
  handleDocumentChanged,
  handleDocumentClosed,
} from '../../src/application/document-lifecycle.js';

function createActions() {
  return {
    abortByUri: vi.fn(),
    clearDiagnostics: vi.fn(),
    clearIssueCount: vi.fn(),
    hasQueryForgeState: vi.fn().mockReturnValue(true),
  };
}

describe('document lifecycle', () => {
  const uri = 'file:///ProductService.cs';

  it('aborts and clears only the changed document with queryforge state', () => {
    const actions = createActions();

    handleDocumentChanged(
      { uri, languageId: 'csharp', contentChangeCount: 1 },
      actions,
    );

    expect(actions.abortByUri).toHaveBeenCalledWith(uri);
    expect(actions.clearDiagnostics).toHaveBeenCalledWith(uri);
    expect(actions.clearIssueCount).toHaveBeenCalledWith(uri);
  });

  it('ignores documents without queryforge state', () => {
    const actions = createActions();
    actions.hasQueryForgeState.mockReturnValue(false);

    handleDocumentChanged(
      { uri, languageId: 'csharp', contentChangeCount: 1 },
      actions,
    );

    expect(actions.abortByUri).not.toHaveBeenCalled();
    expect(actions.clearDiagnostics).not.toHaveBeenCalled();
    expect(actions.clearIssueCount).not.toHaveBeenCalled();
  });

  it('ignores non-csharp document changes', () => {
    const actions = createActions();

    handleDocumentChanged(
      { uri, languageId: 'typescript', contentChangeCount: 1 },
      actions,
    );

    expect(actions.hasQueryForgeState).not.toHaveBeenCalled();
    expect(actions.abortByUri).not.toHaveBeenCalled();
  });

  it('ignores change events without content changes', () => {
    const actions = createActions();

    handleDocumentChanged(
      { uri, languageId: 'csharp', contentChangeCount: 0 },
      actions,
    );

    expect(actions.abortByUri).not.toHaveBeenCalled();
  });

  it('clears state when a document is closed', () => {
    const actions = createActions();

    handleDocumentClosed({ uri }, actions);

    expect(actions.abortByUri).toHaveBeenCalledWith(uri);
    expect(actions.clearDiagnostics).toHaveBeenCalledWith(uri);
    expect(actions.clearIssueCount).toHaveBeenCalledWith(uri);
  });
});
