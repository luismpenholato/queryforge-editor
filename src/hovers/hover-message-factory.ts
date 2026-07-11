import type { QuerySmell } from '@luispenholato/queryforge-mcp';

export interface HoverMarkdownOptions {
  isTrusted?: boolean;
  supportHtml?: boolean;
}

export interface HoverMarkdownResult {
  value: string;
  isTrusted: false;
  supportHtml: false;
}

function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_{}[\]()#+\-.!|>])/g, '\\$1');
}

function formatConfidence(confidence: number): string {
  const percent = Math.round(confidence * 100);
  return `${percent}%`;
}

export function buildHoverMarkdown(smell: QuerySmell): HoverMarkdownResult {
  const lines: string[] = [];

  const title = `**${smell.code}** · ${capitalize(smell.severity)}`;
  lines.push(title);
  lines.push('');
  lines.push(escapeMarkdown(smell.message));

  if (smell.whyItMatters) {
    lines.push('');
    lines.push('**Why it matters**');
    lines.push('');
    lines.push(escapeMarkdown(smell.whyItMatters));
  }

  if (smell.suggestion) {
    lines.push('');
    lines.push('**Suggestion**');
    lines.push('');
    lines.push(escapeMarkdown(smell.suggestion));
  }

  if (smell.rewritePlan?.length) {
    lines.push('');
    lines.push('**Rewrite plan**');
    lines.push('');

    smell.rewritePlan.forEach((step, index) => {
      lines.push(`${index + 1}. ${escapeMarkdown(step)}`);
    });
  }

  lines.push('');
  lines.push(`Confidence: ${formatConfidence(smell.confidence)}`);

  return {
    value: lines.join('\n'),
    isTrusted: false,
    supportHtml: false,
  };
}

function capitalize(value: string): string {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}
