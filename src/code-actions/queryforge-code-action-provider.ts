import * as vscode from 'vscode';
import type { DiagnosticMetadataStore } from '../diagnostics/diagnostic-metadata-store.js';
import { findMetadataForDiagnostic } from '../diagnostics/diagnostic-service.js';
import { toTextDocumentLike } from '../diagnostics/diagnostic-range-mapper.js';
import type { OutputChannelLogger } from '../presentation/output-channel.js';
import {
  formatDocumentChangedMessage,
  getSafeFixes,
  isDocumentVersionStale,
  validateAndMapEdits,
} from './workspace-edit-factory.js';

export class QueryForgeCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

  constructor(
    private readonly metadataStore: DiagnosticMetadataStore,
    private readonly output: OutputChannelLogger,
  ) {}

  provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      if (diagnostic.source !== 'QueryForge') {
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

      const safeFixes = getSafeFixes(metadata.smell.fixes);

      for (const fix of safeFixes) {
        if (!fix.edits?.length) {
          continue;
        }

        const validation = validateAndMapEdits({
          edits: fix.edits,
          baseOffset: metadata.baseOffset,
          analyzedCodeLength: metadata.analyzedCodeLength,
          documentLength: document.getText().length,
        });

        if (!validation.valid) {
          if (validation.warning) {
            this.output.warn(validation.warning);
          }
          continue;
        }

        const action = new vscode.CodeAction(
          `QueryForge: ${fix.title}`,
          vscode.CodeActionKind.QuickFix,
        );
        action.diagnostics = [diagnostic];
        action.isPreferred = true;

        action.command = {
          command: 'queryforge.applySafeFix',
          title: fix.title,
          arguments: [
            document.uri.toString(),
            metadata.documentVersion,
            validation.absoluteEdits,
          ],
        };

        actions.push(action);
      }
    }

    return actions;
  }
}

export async function applySafeFix(
  uriString: string,
  expectedVersion: number,
  edits: Array<{ startOffset: number; endOffset: number; newText: string }>,
  output: OutputChannelLogger,
): Promise<void> {
  const uri = vscode.Uri.parse(uriString);
  const document = vscode.workspace.textDocuments.find((item) => item.uri.toString() === uriString);

  if (!document) {
    return;
  }

  if (
    isDocumentVersionStale({
      currentVersion: document.version,
      expectedVersion,
    })
  ) {
    await vscode.window.showInformationMessage(formatDocumentChangedMessage());
    return;
  }

  const workspaceEdit = new vscode.WorkspaceEdit();

  for (const edit of [...edits].sort((a, b) => b.startOffset - a.startOffset)) {
    const range = new vscode.Range(
      document.positionAt(edit.startOffset),
      document.positionAt(edit.endOffset),
    );
    workspaceEdit.replace(uri, range, edit.newText);
  }

  const applied = await vscode.workspace.applyEdit(workspaceEdit);
  if (!applied) {
    output.warn('Workspace edit was not applied.');
  }
}
