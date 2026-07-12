import { describe, expect, it, vi } from 'vitest';
import { AnalysisCoordinator } from '../../src/application/analysis-coordinator.js';
import { analyzeCurrentSelection } from '../../src/application/analyze-selection.service.js';
import {
  NON_CSHARP_FILE_MESSAGE,
  NO_ACTIVE_EDITOR_MESSAGE,
  type PublishableDocument,
} from '../../src/application/analyze-document.service.js';
import { QueryForgeConfiguration } from '../../src/configuration/queryforge-configuration.js';
import { createConfigurationReader, createFakeDocument } from '../support/fakes.js';

function createDeps(overrides: Partial<Parameters<typeof analyzeCurrentSelection>[0]> = {}) {
  return {
    getActiveEditor: () => undefined,
    analysisService: { analyze: vi.fn() },
    coordinator: new AnalysisCoordinator(),
    diagnosticService: { publish: vi.fn() },
    configuration: new QueryForgeConfiguration(createConfigurationReader({})),
    output: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), show: vi.fn() },
    statusBar: { setIssueCount: vi.fn(), setAnalyzing: vi.fn(), clearAnalyzing: vi.fn() },
    workspace: { asRelativePath: () => 'a.cs' },
    showOnError: true,
    showInformationMessage: vi.fn(),
    ...overrides,
  };
}

describe('analyze-selection.service', () => {
  it('shows feedback when there is no active editor', async () => {
    const showInformationMessage = vi.fn();

    await analyzeCurrentSelection(createDeps({ showInformationMessage }));

    expect(showInformationMessage).toHaveBeenCalledWith(NO_ACTIVE_EDITOR_MESSAGE);
  });

  it('shows feedback for non-csharp files', async () => {
    const showInformationMessage = vi.fn();
    const base = createFakeDocument('code', 'file:///a.ts');
    const document = { ...base, languageId: 'typescript' } as PublishableDocument;

    await analyzeCurrentSelection(
      createDeps({
        getActiveEditor: () => ({
          document,
          selection: {
            start: document.positionAt(0),
            end: document.positionAt(1),
            isEmpty: false,
          },
        }),
        showInformationMessage,
      }),
    );

    expect(showInformationMessage).toHaveBeenCalledWith(NON_CSHARP_FILE_MESSAGE);
  });

  it('requires non-empty selection', async () => {
    const showInformationMessage = vi.fn();
    const analyze = vi.fn();
    const document = createFakeDocument('code', 'file:///a.cs') as PublishableDocument;

    await analyzeCurrentSelection(
      createDeps({
        getActiveEditor: () => ({
          document,
          selection: {
            start: document.positionAt(0),
            end: document.positionAt(0),
            isEmpty: true,
          },
        }),
        analysisService: { analyze },
        showInformationMessage,
      }),
    );

    expect(showInformationMessage).toHaveBeenCalledWith(
      'Select a C# query or expression before running this command.',
    );
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
    const setIssueCount = vi.fn();
    const document = createFakeDocument('prefix SELECTED suffix', 'file:///a.cs') as PublishableDocument;

    await analyzeCurrentSelection(
      createDeps({
        getActiveEditor: () => ({
          document,
          selection: {
            start: document.positionAt(7),
            end: document.positionAt(15),
            isEmpty: false,
          },
        }),
        analysisService: { analyze },
        diagnosticService: { publish },
        statusBar: { setIssueCount, setAnalyzing: vi.fn(), clearAnalyzing: vi.fn() },
      }),
    );

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
    expect(setIssueCount).toHaveBeenCalledWith('file:///a.cs', 0);
  });
});
