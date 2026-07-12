export interface SaveableDocumentLike {
  readonly languageId: string;
  readonly uri: { readonly scheme: string; toString(): string };
  readonly isDirty?: boolean;
}

export function shouldAnalyzeDocumentOnSave(
  document: SaveableDocumentLike,
  runOnSave: boolean,
): boolean {
  if (!runOnSave) {
    return false;
  }

  if (document.languageId !== 'csharp') {
    return false;
  }

  if (document.uri.scheme === 'untitled') {
    return false;
  }

  if (document.isDirty) {
    return false;
  }

  return true;
}
