import type { QuerySmell } from '@luispenholato/queryforge-mcp';
import type { MinimumSeverity } from '../diagnostics/severity.js';
import { VALID_SEVERITIES } from '../diagnostics/severity.js';
import { filterSmellsByMinimumSeverity } from '../diagnostics/diagnostic-mapper.js';

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
}

export function countSmellsBySeverity(smells: QuerySmell[]): SeverityCounts {
  const counts: SeverityCounts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    info: 0,
  };

  for (const smell of smells) {
    counts[smell.severity] += 1;
  }

  return counts;
}

export function countSafeFixes(smells: QuerySmell[]): number {
  return smells.filter((smell) =>
    smell.fixes?.some((fix) => fix.safety === 'safe' && fix.edits && fix.edits.length > 0),
  ).length;
}

export function formatSeveritySummary(counts: SeverityCounts): string {
  return VALID_SEVERITIES.map(
    (severity) => `${capitalizeSeverity(severity)}: ${counts[severity]}`,
  ).join(' | ');
}

export function buildAnalysisSummaryLines(options: {
  smells: QuerySmell[];
  minimumSeverity: MinimumSeverity;
  issueCount: number;
}): string[] {
  const filteredSmells = filterSmellsByMinimumSeverity(options.smells, options.minimumSeverity);
  const severityCounts = countSmellsBySeverity(filteredSmells);
  const safeFixCount = countSafeFixes(filteredSmells);

  const lines = [
    options.issueCount > 0
      ? `Found ${options.issueCount} potential issues.`
      : 'Found 0 potential issues.',
  ];

  if (options.issueCount > 0) {
    lines.push(formatSeveritySummary(severityCounts));
    lines.push(`Safe fixes available: ${safeFixCount}`);
  }

  return lines;
}

function capitalizeSeverity(severity: keyof SeverityCounts): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}
