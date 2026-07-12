export interface DocumentLifecycleActions {
  abortByUri(uri: string): void;
  clearDiagnostics(uri: string): void;
  clearIssueCount(uri: string): void;
  hasQueryForgeState(uri: string): boolean;
}

export function handleDocumentChanged(
  input: {
    uri: string;
    languageId: string;
    contentChangeCount: number;
  },
  actions: DocumentLifecycleActions,
): void {
  if (input.contentChangeCount === 0) {
    return;
  }

  if (input.languageId !== 'csharp') {
    return;
  }

  if (!actions.hasQueryForgeState(input.uri)) {
    return;
  }

  actions.abortByUri(input.uri);
  actions.clearDiagnostics(input.uri);
  actions.clearIssueCount(input.uri);
}

export function handleDocumentClosed(
  input: { uri: string },
  actions: DocumentLifecycleActions,
): void {
  actions.abortByUri(input.uri);
  actions.clearDiagnostics(input.uri);
  actions.clearIssueCount(input.uri);
}
