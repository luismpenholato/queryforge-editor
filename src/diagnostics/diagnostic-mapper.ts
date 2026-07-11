import type { QuerySmell } from '@luispenholato/queryforge-mcp';
import type { AnalysisKind } from './diagnostic-range-mapper.js';
import { meetsMinimumSeverity } from './severity.js';
import type { MinimumSeverity } from './severity.js';

export type DiagnosticSeverityLevel = 'error' | 'warning' | 'information' | 'hint';

export interface MappedDiagnostic {
  severity: DiagnosticSeverityLevel;
  message: string;
  source: string;
  code: string;
  startOffset: number;
  endOffset: number;
  rangeValid: boolean;
  smell: QuerySmell;
}

export function mapSmellSeverity(severity: QuerySmell['severity']): DiagnosticSeverityLevel {
  switch (severity) {
    case 'critical':
    case 'high':
      return 'error';
    case 'medium':
      return 'warning';
    case 'low':
      return 'information';
    case 'info':
    default:
      return 'hint';
  }
}

export function mapSmellToDiagnostic(
  smell: QuerySmell,
  startOffset: number,
  endOffset: number,
  rangeValid: boolean,
): MappedDiagnostic {
  return {
    severity: mapSmellSeverity(smell.severity),
    message: smell.message,
    source: 'QueryForge',
    code: smell.code,
    startOffset,
    endOffset,
    rangeValid,
    smell,
  };
}

export function filterSmellsByMinimumSeverity(
  smells: QuerySmell[],
  minimumSeverity: MinimumSeverity,
): QuerySmell[] {
  return smells.filter((smell) => meetsMinimumSeverity(smell.severity, minimumSeverity));
}

export interface DiagnosticMappingInput {
  smell: QuerySmell;
  startOffset: number;
  endOffset: number;
  rangeValid: boolean;
  analysisKind: AnalysisKind;
  baseOffset: number;
  documentVersion: number;
  documentUri: string;
}

export function buildDiagnosticKey(
  documentUri: string,
  startOffset: number,
  endOffset: number,
  code: string,
  fingerprint?: string,
): string {
  return `${documentUri}|${startOffset}|${endOffset}|${code}|${fingerprint ?? ''}`;
}
