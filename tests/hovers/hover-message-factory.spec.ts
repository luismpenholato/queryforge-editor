import { describe, expect, it } from 'vitest';
import { buildHoverMarkdown } from '../../src/hovers/hover-message-factory.js';

describe('hover-message-factory', () => {
  it('omits empty sections', () => {
    const markdown = buildHoverMarkdown({
      code: 'COUNT_GREATER_THAN_ZERO',
      title: 'Count',
      severity: 'medium',
      message: 'Counting all records only to check existence may perform unnecessary work.',
      suggestion: 'Use Any.',
      confidence: 0.95,
    });

    expect(markdown.value).toContain('COUNT_GREATER_THAN_ZERO');
    expect(markdown.value).not.toContain('**Why it matters**');
    expect(markdown.value).not.toContain('**Rewrite plan**');
    expect(markdown.value).toContain('Confidence: 95%');
    expect(markdown.isTrusted).toBe(false);
    expect(markdown.supportHtml).toBe(false);
  });

  it('includes rewrite plan and why it matters', () => {
    const markdown = buildHoverMarkdown({
      code: 'RULE',
      title: 'Rule',
      severity: 'high',
      message: 'Message',
      suggestion: 'Suggestion',
      confidence: 0.5,
      whyItMatters: 'Because',
      rewritePlan: ['Step 1', 'Step 2'],
    });

    expect(markdown.value).toContain('**Why it matters**');
    expect(markdown.value).toContain('**Rewrite plan**');
    expect(markdown.value).toContain('1. Step 1');
    expect(markdown.value).toContain('Confidence: 50%');
  });
});
