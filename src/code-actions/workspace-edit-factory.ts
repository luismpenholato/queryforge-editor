import type { QueryFix, QueryTextEdit } from '@luispenholato/queryforge-mcp';

export interface WorkspaceEditRange {
  startOffset: number;
  endOffset: number;
  newText: string;
}

export interface ValidateEditsInput {
  edits: QueryTextEdit[];
  baseOffset: number;
  analyzedCodeLength: number;
  documentLength: number;
}

export interface ValidateEditsResult {
  valid: boolean;
  absoluteEdits: WorkspaceEditRange[];
  warning?: string;
}

export function validateAndMapEdits(input: ValidateEditsInput): ValidateEditsResult {
  const { edits, baseOffset, analyzedCodeLength, documentLength } = input;

  if (!edits.length) {
    return { valid: false, absoluteEdits: [], warning: 'Fix has no edits.' };
  }

  const absoluteEdits: WorkspaceEditRange[] = [];

  for (const edit of edits) {
    const { range, newText } = edit;

    if (
      !Number.isInteger(range.start) ||
      !Number.isInteger(range.end) ||
      range.start < 0 ||
      range.end <= range.start ||
      range.end > analyzedCodeLength
    ) {
      return {
        valid: false,
        absoluteEdits: [],
        warning: 'Fix contains an invalid edit range.',
      };
    }

    const startOffset = baseOffset + range.start;
    const endOffset = baseOffset + range.end;

    if (endOffset > documentLength) {
      return {
        valid: false,
        absoluteEdits: [],
        warning: 'Fix edit range exceeds document bounds.',
      };
    }

    absoluteEdits.push({ startOffset, endOffset, newText });
  }

  const sorted = [...absoluteEdits].sort((a, b) => b.startOffset - a.startOffset);

  for (let index = 0; index < sorted.length - 1; index += 1) {
    const current = sorted[index];
    const next = sorted[index + 1];

    if (current && next && current.startOffset < next.endOffset) {
      return {
        valid: false,
        absoluteEdits: [],
        warning: 'Fix edits overlap and cannot be applied safely.',
      };
    }
  }

  return { valid: true, absoluteEdits };
}

export function getSafeFixes(fixes: QueryFix[] | undefined): QueryFix[] {
  if (!fixes?.length) {
    return [];
  }

  return fixes.filter((fix) => fix.safety === 'safe');
}

export function shouldOfferFix(fix: QueryFix): boolean {
  return fix.safety === 'safe';
}

export interface DocumentVersionCheck {
  currentVersion: number;
  expectedVersion: number;
}

export function isDocumentVersionStale(check: DocumentVersionCheck): boolean {
  return check.currentVersion !== check.expectedVersion;
}

export function formatDocumentChangedMessage(): string {
  return 'The document changed after the QueryForge analysis. Run the analysis again before applying this fix.';
}
