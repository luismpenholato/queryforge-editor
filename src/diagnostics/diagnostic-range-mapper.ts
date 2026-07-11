export interface DocumentUriLike {
  toString(): string;
  fsPath?: string;
  path?: string;
}

export interface TextPosition {
  line: number;
  character: number;
}

export interface TextDocumentLike {
  readonly uri: DocumentUriLike;
  readonly version: number;
  getText(): string;
  offsetAt(position: TextPosition): number;
  positionAt(offset: number): TextPosition;
}

export interface TextSelectionLike {
  readonly start: TextPosition;
  readonly end: TextPosition;
  isEmpty: boolean;
}

export type AnalysisKind = 'document' | 'selection';

export interface RangeMappingResult {
  startOffset: number;
  endOffset: number;
  valid: boolean;
}

export interface RangeMappingWarning {
  message: string;
}

export interface MapDiagnosticRangeOptions {
  analyzedCode: string;
  baseOffset: number;
  analysisKind: AnalysisKind;
  smellCode: string;
  range?: { start: number; end: number } | undefined;
}

function findFirstNonEmptyLineRange(text: string): { start: number; end: number } | undefined {
  const match = /\S/.exec(text);
  if (!match || match.index === undefined) {
    return undefined;
  }

  const start = match.index;
  const lineBreak = text.indexOf('\n', start);
  const end = lineBreak === -1 ? text.length : lineBreak;
  return { start, end };
}

function isRangeValid(
  range: { start: number; end: number },
  analyzedCodeLength: number,
): boolean {
  return (
    Number.isInteger(range.start) &&
    Number.isInteger(range.end) &&
    range.start >= 0 &&
    range.end > range.start &&
    range.end <= analyzedCodeLength
  );
}

export function mapDiagnosticRange(
  document: TextDocumentLike,
  options: MapDiagnosticRangeOptions,
): { result: RangeMappingResult; warning?: RangeMappingWarning } {
  const { analyzedCode, baseOffset, analysisKind, range } = options;

  if (range && isRangeValid(range, analyzedCode.length)) {
    const startOffset = baseOffset + range.start;
    const endOffset = baseOffset + range.end;
    const documentLength = document.getText().length;

    if (endOffset <= documentLength) {
      return {
        result: {
          startOffset,
          endOffset,
          valid: true,
        },
      };
    }
  }

  if (range) {
    const warning: RangeMappingWarning = {
      message: `Invalid range for smell ${options.smellCode}; using fallback.`,
    };

    if (analysisKind === 'selection') {
      const selectionEnd = baseOffset + analyzedCode.length;
      return {
        result: {
          startOffset: baseOffset,
          endOffset: selectionEnd,
          valid: false,
        },
        warning,
      };
    }

    const fallback = findFirstNonEmptyLineRange(analyzedCode);
    if (fallback) {
      return {
        result: {
          startOffset: baseOffset + fallback.start,
          endOffset: baseOffset + fallback.end,
          valid: false,
        },
        warning,
      };
    }

    return {
      result: {
        startOffset: 0,
        endOffset: Math.min(1, document.getText().length),
        valid: false,
      },
      warning,
    };
  }

  if (analysisKind === 'selection') {
    const selectionEnd = baseOffset + analyzedCode.length;
    return {
      result: {
        startOffset: baseOffset,
        endOffset: selectionEnd,
        valid: false,
      },
      warning: {
        message: `Missing range for smell ${options.smellCode}; using selection fallback.`,
      },
    };
  }

  const fallback = findFirstNonEmptyLineRange(analyzedCode);
  if (fallback) {
    return {
      result: {
        startOffset: baseOffset + fallback.start,
        endOffset: baseOffset + fallback.end,
        valid: false,
      },
      warning: {
        message: `Missing range for smell ${options.smellCode}; using first non-empty line fallback.`,
      },
    };
  }

  return {
    result: {
      startOffset: 0,
      endOffset: Math.min(1, document.getText().length),
      valid: false,
    },
    warning: {
      message: `Missing range for smell ${options.smellCode}; using minimal fallback.`,
    },
  };
}

export function offsetsToRange(
  document: TextDocumentLike,
  startOffset: number,
  endOffset: number,
): { start: TextPosition; end: TextPosition } {
  return {
    start: document.positionAt(startOffset),
    end: document.positionAt(endOffset),
  };
}

export function toTextDocumentLike(document: {
  readonly uri: DocumentUriLike;
  readonly version: number;
  getText(): string;
  offsetAt(position: { line: number; character: number }): number;
  positionAt(offset: number): { line: number; character: number };
}): TextDocumentLike {
  return {
    uri: document.uri,
    version: document.version,
    getText: () => document.getText(),
    offsetAt: (position) => document.offsetAt(position),
    positionAt: (offset) => document.positionAt(offset),
  };
}
