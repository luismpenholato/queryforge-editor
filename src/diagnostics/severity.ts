import type { Severity } from '@luispenholato/queryforge-mcp';

export type MinimumSeverity = Severity;

export const SEVERITY_ORDER: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

export const VALID_SEVERITIES: readonly Severity[] = [
  'info',
  'low',
  'medium',
  'high',
  'critical',
];

export function compareSeverity(a: Severity, b: Severity): number {
  return SEVERITY_ORDER[a] - SEVERITY_ORDER[b];
}

export function meetsMinimumSeverity(severity: Severity, minimum: MinimumSeverity): boolean {
  return SEVERITY_ORDER[severity] >= SEVERITY_ORDER[minimum];
}

export function isValidSeverity(value: string): value is Severity {
  return (VALID_SEVERITIES as readonly string[]).includes(value);
}
