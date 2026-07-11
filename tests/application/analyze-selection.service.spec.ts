import { describe, expect, it, vi } from 'vitest';
import { AnalysisCoordinator } from '../../src/application/analysis-coordinator.js';
import { analyzeCurrentSelection } from '../../src/application/analyze-selection.service.js';
import type { PublishableDocument } from '../../src/application/analyze-document.service.js';
import { QueryForgeConfiguration } from '../../src/configuration/queryforge-configuration.js';
import { createConfigurationReader, createFakeDocument } from '../support/fakes.js';

describe('analyze-selection.service', () => {
  it('requires non-empty selection', async () => {
    const showInformationMessage = vi.fn();
    const analyze = vi.fn();
    const document = createFakeDocument('code', 'file:///a.cs') as PublishableDocument;

    await analyzeCurrentSelection({
      getActiveEditor: () => ({
        document,
        selection: {
          start: document.positionAt(0),
          end: document.positionAt(0),
          isEmpty: true,
        },
      }),
      analysisService: { analyze },
      coordinator: new AnalysisCoordinator(),
      diagnosticService: { publish: vi.fn() },
      configuration: new QueryForgeConfiguration(createConfigurationReader({})),
      output: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), show: vi.fn() },
      statusBar: { setIssueCount: vi.fn() },
      workspace: { asRelativePath: () => 'a.cs' },
      showOnError: true,
      showInformationMessage,
    });

    expect(showInformationMessage).toHaveBeenCalled();
    expect(analyze).not.toHaveBeenCalled();
  });

  it('analyzes only selected text with base offset', async () => {
    const analyze = vi.fn().mockReturnValue({
      summary: 'summary',
      severity: 'low',
      smells: [],
      recommendations: [],
      manualReviewRequired: false,
    });
    const publish = vi.fn().mockReturnValue(0);
    const document = createFakeDocument('prefix SELECTED suffix', 'file:///a.cs') as PublishableDocument;

    await analyzeCurrentSelection({
      getActiveEditor: () => ({
        document,
        selection: {
          start: document.positionAt(7),
          end: document.positionAt(15),
          isEmpty: false,
        },
      }),
      analysisService: { analyze },
      coordinator: new AnalysisCoordinator(),
      diagnosticService: { publish },
      configuration: new QueryForgeConfiguration(createConfigurationReader({})),
      output: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), show: vi.fn() },
      statusBar: { setIssueCount: vi.fn() },
      workspace: { asRelativePath: () => 'a.cs' },
      showOnError: true,
      showInformationMessage: vi.fn(),
    });

    expect(analyze).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'SELECTED' }),
      expect.any(Object),
    );
    expect(publish).toHaveBeenCalledWith(
      expect.objectContaining({
        analyzedCode: 'SELECTED',
        baseOffset: 7,
        analysisKind: 'selection',
      }),
    );
  });
});
