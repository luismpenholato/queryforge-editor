import * as vscode from 'vscode';
import type { DiagnosticMetadataStore } from '../diagnostics/diagnostic-metadata-store.js';
import { findMetadataForDiagnostic } from '../diagnostics/diagnostic-service.js';
import { toTextDocumentLike } from '../diagnostics/diagnostic-range-mapper.js';
import { buildHoverMarkdown } from '../hovers/hover-message-factory.js';

export class QueryForgeHoverProvider implements vscode.HoverProvider {
  constructor(private readonly metadataStore: DiagnosticMetadataStore) {}

  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.Hover | undefined {
    const diagnostics = vscode.languages.getDiagnostics(document.uri);
    const queryForgeDiagnostics = diagnostics.filter((diagnostic) => diagnostic.source === 'QueryForge');

    for (const diagnostic of queryForgeDiagnostics) {
      if (!diagnostic.range.contains(position)) {
        continue;
      }

      const metadata = findMetadataForDiagnostic(
        this.metadataStore,
        document.uri.toString(),
        diagnostic,
        toTextDocumentLike(document),
      );

      if (!metadata) {
        continue;
      }

      const markdown = buildHoverMarkdown(metadata.smell);
      const markdownString = new vscode.MarkdownString(markdown.value);
      markdownString.isTrusted = markdown.isTrusted;
      markdownString.supportHtml = markdown.supportHtml;

      return new vscode.Hover(markdownString, diagnostic.range);
    }

    return undefined;
  }
}
