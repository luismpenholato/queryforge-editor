import * as vscode from 'vscode';
import type { QuerySmell } from '@luispenholato/queryforge-mcp';
import type { MinimumSeverity } from './severity.js';
import {
  buildDiagnosticKey,
  filterSmellsByMinimumSeverity,
  mapSmellToDiagnostic,
} from './diagnostic-mapper.js';
import {
  mapDiagnosticRange,
  offsetsToRange,
  toTextDocumentLike,
  type AnalysisKind,
  type TextDocumentLike,
} from './diagnostic-range-mapper.js';
import {
  DiagnosticMetadataStore,
  type DiagnosticMetadata,
} from './diagnostic-metadata-store.js';

export interface PublishableEditorDocument {
  readonly uri: vscode.Uri;
  readonly version: number;
  getText(): string;
  offsetAt(position: vscode.Position): number;
  positionAt(offset: number): vscode.Position;
}

export interface PublishDiagnosticsOptions {
  document: PublishableEditorDocument;
  smells: QuerySmell[];
  analyzedCode: string;
  baseOffset: number;
  analysisKind: AnalysisKind;
  documentVersion: number;
  minimumSeverity: MinimumSeverity;
  onRangeWarning?: (message: string) => void;
}

export class DiagnosticService {
  constructor(
    private readonly collection: vscode.DiagnosticCollection,
    private readonly metadataStore: DiagnosticMetadataStore,
  ) {}

  clearAll(): void {
    this.collection.clear();
    this.metadataStore.clearAll();
  }

  clearByUri(uri: vscode.Uri): void {
    this.collection.delete(uri);
    this.metadataStore.clearByUri(uri.toString());
  }

  publish(options: PublishDiagnosticsOptions): number {
    const {
      document,
      smells,
      analyzedCode,
      baseOffset,
      analysisKind,
      documentVersion,
      minimumSeverity,
      onRangeWarning,
    } = options;

    const textDocument = toTextDocumentLike(document);
    const filteredSmells = filterSmellsByMinimumSeverity(smells, minimumSeverity);
    const diagnostics: vscode.Diagnostic[] = [];
    const metadataItems: DiagnosticMetadata[] = [];

    for (const smell of filteredSmells) {
      const rangeOptions = {
        analyzedCode,
        baseOffset,
        analysisKind,
        smellCode: smell.code,
        ...(smell.range ? { range: smell.range } : {}),
      };

      const { result, warning } = mapDiagnosticRange(textDocument, rangeOptions);

      if (warning && onRangeWarning) {
        onRangeWarning(warning.message);
      }

      const mapped = mapSmellToDiagnostic(
        smell,
        result.startOffset,
        result.endOffset,
        result.valid,
      );

      const { start, end } = offsetsToRange(textDocument, mapped.startOffset, mapped.endOffset);
      const range = new vscode.Range(
        new vscode.Position(start.line, start.character),
        new vscode.Position(end.line, end.character),
      );

      const diagnostic = new vscode.Diagnostic(range, mapped.message, toVscodeSeverity(mapped.severity));
      diagnostic.source = mapped.source;
      diagnostic.code = mapped.code;

      const key = buildDiagnosticKey(
        document.uri.toString(),
        mapped.startOffset,
        mapped.endOffset,
        smell.code,
        smell.fingerprint,
      );

      diagnostics.push(diagnostic);
      metadataItems.push({
        smell,
        analysisKind,
        baseOffset,
        analyzedCodeLength: analyzedCode.length,
        documentVersion,
        key,
      });
    }

    this.metadataStore.replaceForUri(document.uri.toString(), metadataItems);
    this.collection.set(document.uri, diagnostics);

    return diagnostics.length;
  }
}

function toVscodeSeverity(
  severity: 'error' | 'warning' | 'information' | 'hint',
): vscode.DiagnosticSeverity {
  switch (severity) {
    case 'error':
      return vscode.DiagnosticSeverity.Error;
    case 'warning':
      return vscode.DiagnosticSeverity.Warning;
    case 'information':
      return vscode.DiagnosticSeverity.Information;
    case 'hint':
    default:
      return vscode.DiagnosticSeverity.Hint;
  }
}

export function findMetadataForDiagnostic(
  store: DiagnosticMetadataStore,
  documentUri: string,
  diagnostic: vscode.Diagnostic,
  document: TextDocumentLike,
): DiagnosticMetadata | undefined {
  const startOffset = document.offsetAt(diagnostic.range.start);
  const endOffset = document.offsetAt(diagnostic.range.end);
  const code = String(diagnostic.code ?? '');

  const key = buildDiagnosticKey(documentUri, startOffset, endOffset, code);
  const exact = store.get(key);
  if (exact) {
    return exact;
  }

  for (const metadata of store.getAllForUri(documentUri)) {
    if (metadata.smell.code !== code) {
      continue;
    }

    const expectedKey = buildDiagnosticKey(
      documentUri,
      startOffset,
      endOffset,
      metadata.smell.code,
      metadata.smell.fingerprint,
    );

    if (metadata.key === expectedKey) {
      return metadata;
    }
  }

  return undefined;
}
