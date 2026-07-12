import type { TextDocumentLike, TextPosition } from '../../src/diagnostics/diagnostic-range-mapper.js';
import type * as vscode from 'vscode';

export function createFakeDocument(
  text: string,
  uri: vscode.Uri | string = 'file:///test/Example.cs',
  version = 1,
): TextDocumentLike & {
  languageId: string;
  uri: vscode.Uri;
  offsetAt(position: vscode.Position): number;
  positionAt(offset: number): vscode.Position;
} {
  const vscodeUri =
    typeof uri === 'string'
      ? ({ toString: () => uri, fsPath: uri.replace('file://', '') } as vscode.Uri)
      : uri;
  const lineStarts = buildLineStarts(text);

  return {
    uri: vscodeUri,
    languageId: 'csharp',
    version,
    offsetAt(position: TextPosition | vscode.Position): number {
      const lineStart = lineStarts[position.line] ?? 0;
      return Math.min(text.length, lineStart + position.character);
    },
    positionAt(offset: number): vscode.Position {
      const clamped = Math.max(0, Math.min(text.length, offset));
      for (let index = lineStarts.length - 1; index >= 0; index -= 1) {
        const start = lineStarts[index];
        if (start !== undefined && clamped >= start) {
          return { line: index, character: clamped - start } as vscode.Position;
        }
      }

      return { line: 0, character: clamped } as vscode.Position;
    },
    getText(range?: { start: TextPosition | vscode.Position; end: TextPosition | vscode.Position }): string {
      if (!range) {
        return text;
      }

      const start = lineStarts[range.start.line] ?? 0;
      const endOffset = lineStarts[range.end.line] ?? 0;
      const startOffset = Math.min(text.length, start + range.start.character);
      const end = Math.min(text.length, endOffset + range.end.character);
      return text.slice(startOffset, end);
    },
  };
}

function buildLineStarts(text: string): number[] {
  const starts = [0];

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] === '\n') {
      starts.push(index + 1);
    }
  }

  return starts;
}

export function createConfigurationReader(
  values: Record<string, unknown>,
): { get<T>(section: string, key: string): T | undefined } {
  return {
    get<T>(section: string, key: string): T | undefined {
      const fullKey = `${section}.${key}`;
      return values[fullKey] as T | undefined;
    },
  };
}
