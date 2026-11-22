import { describe, expect, it, vi } from 'vitest';
import type { QueryAnalysisResult } from '@luispenholato/queryforge-mcp';
import { AnalysisCoordinator } from '../../src/application/analysis-coordinator.js';
import {
  NO_OPEN_CSHARP_DOCUMENTS_MESSAGE,
  analyzeOpenDocuments,
} from '../../src/application/analyze-open-documents.service.js';
import type { PublishableDocument } from '../../src/application/analyze-document.service.js';
import { QueryForgeConfiguration } from '../../src/configuration/queryforge-configuration.js';
import { createConfigurationReader, createFakeDocument } from '../support/fakes.js';

function createAnalysisResult(smells: QueryAnalysisResult['smells']): QueryAnalysisResult {
  return {
    summary: 'summary',
    severity: 'medium',
    smells,
    recommendations: [],
    manualReviewRequired: false,
  };
}

function asPublishable(
  document: ReturnType<typeof createFakeDocument>,
  languageId = 'csharp',
): PublishableDocument {
  return { ...document, languageId } as PublishableDocument;
}

function createDeps(overrides: Partial<Parameters<typeof analyzeOpenDocuments>[0]> = {}) {
  return {
    getActiveEditor: () => undefined,
    getOpenDocuments: () => [],
    analysisService: { analyze: vi.fn() },
    coordinator: new AnalysisCoordinator(),
    diagnosticService: { publish: vi.fn().mockReturnValue(0) },
    configuration: new QueryForgeConfiguration(createConfigurationReader({})),
    output: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), show: vi.fn() },
    statusBar: { setIssueCount: vi.fn(), setAnalyzing: vi.fn(), clearAnalyzing: vi.fn() },
    workspace: { asRelativePath: () => 'Example.cs' },
    showOnError: true,
    showInformationMessage: vi.fn(),
    ...overrides,
  };
}

describe('analyze-open-documents.service', () => {
  it('shows feedback when no C# documents are open', async () => {
    const showInformationMessage = vi.fn();
    const analyze = vi.fn();

    await analyzeOpenDocuments(
      createDeps({
        getOpenDocuments: () => [asPublishable(createFakeDocument('code', 'file:///a.ts'), 'typescript')],
        analysisService: { analyze },
        showInformationMessage,
      }),
    );

    expect(showInformationMessage).toHaveBeenCalledWith(NO_OPEN_CSHARP_DOCUMENTS_MESSAGE);
    expect(analyze).not.toHaveBeenCalled();
  });

  it('analyzes every open C# document', async () => {
    const first = asPublishable(createFakeDocument('code a', 'file:///a.cs'));
    const second = asPublishable(createFakeDocument('code b', 'file:///b.cs'));
    const ignored = asPublishable(createFakeDocument('code c', 'file:///c.ts'), 'typescript');
    const analyze = vi.fn().mockReturnValue(createAnalysisResult([]));
    const publish = vi.fn().mockReturnValue(0);
    const showInformationMessage = vi.fn();
    const log = vi.fn();

    await analyzeOpenDocuments(
      createDeps({
        getOpenDocuments: () => [first, ignored, second],
        analysisService: { analyze },
        diagnosticService: { publish },
        showInformationMessage,
        output: { log, warn: vi.fn(), error: vi.fn(), show: vi.fn() },
      }),
    );

    expect(analyze).toHaveBeenCalledTimes(2);
    expect(publish).toHaveBeenCalledTimes(2);
    expect(showInformationMessage).toHaveBeenCalledWith('QueryForge analyzed 2 open C# documents.');
    expect(log).toHaveBeenCalledWith('Analyzing 2 open C# document(s)...');
    expect(log).toHaveBeenCalledWith('Finished analyzing 2 open C# document(s).');
  });
});
