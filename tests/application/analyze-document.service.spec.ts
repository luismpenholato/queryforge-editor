import { describe, expect, it, vi } from 'vitest';
import type { QueryAnalysisResult } from '@luispenholato/queryforge-mcp';
import { AnalysisCoordinator } from '../../src/application/analysis-coordinator.js';
import {
  NON_CSHARP_FILE_MESSAGE,
  NO_ACTIVE_EDITOR_MESSAGE,
  analyzeCurrentDocument,
  analyzeDocument,
  resolveAnalysisFilePath,
  type PublishableDocument,
} from '../../src/application/analyze-document.service.js';
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

function createDeps(overrides: Partial<Parameters<typeof analyzeCurrentDocument>[0]> = {}) {
  return {
    getActiveEditor: () => undefined,
    analysisService: { analyze: vi.fn() },
    coordinator: new AnalysisCoordinator(),
    diagnosticService: { publish: vi.fn() },
    configuration: new QueryForgeConfiguration(createConfigurationReader({})),
    output: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), show: vi.fn() },
    statusBar: { setIssueCount: vi.fn(), setAnalyzing: vi.fn(), clearAnalyzing: vi.fn() },
    workspace: { asRelativePath: () => 'Example.cs' },
    showOnError: true,
    showInformationMessage: vi.fn(),
    ...overrides,
  };
}

describe('analyze-document.service', () => {
  it('resolves relative workspace path', () => {
    const path = resolveAnalysisFilePath(
      { fsPath: 'C:/workspace/src/ProductService.cs', toString: () => 'file:///workspace/src/ProductService.cs' },
      {
        asRelativePath: () => 'src/ProductService.cs',
      },
    );

    expect(path).toBe('src/ProductService.cs');
  });

  it('shows feedback when there is no active editor', async () => {
    const showInformationMessage = vi.fn();
    const publish = vi.fn();

    await analyzeCurrentDocument(
      createDeps({
        showInformationMessage,
        diagnosticService: { publish },
      }),
    );

    expect(showInformationMessage).toHaveBeenCalledWith(NO_ACTIVE_EDITOR_MESSAGE);
    expect(publish).not.toHaveBeenCalled();
  });

  it('shows feedback for non-csharp files', async () => {
    const analyze = vi.fn();
    const showInformationMessage = vi.fn();
    const base = createFakeDocument('text', 'file:///a.ts');
    const document = { ...base, languageId: 'typescript' } as PublishableDocument;

    await analyzeCurrentDocument(
      createDeps({
        getActiveEditor: () => ({ document }),
        analysisService: { analyze },
        showInformationMessage,
      }),
    );

    expect(showInformationMessage).toHaveBeenCalledWith(NON_CSHARP_FILE_MESSAGE);
    expect(analyze).not.toHaveBeenCalled();
  });

  it('passes maxIssues and relative path to core', async () => {
    const analyze = vi.fn().mockReturnValue(createAnalysisResult([]));
    const publish = vi.fn().mockReturnValue(0);
    const setIssueCount = vi.fn();
    const document = createFakeDocument(
      'await db.Products.CountAsync();',
      'file:///workspace/ProductService.cs',
    ) as PublishableDocument;

    await analyzeCurrentDocument(
      createDeps({
        getActiveEditor: () => ({ document }),
        analysisService: { analyze },
        diagnosticService: { publish },
        statusBar: { setIssueCount, setAnalyzing: vi.fn(), clearAnalyzing: vi.fn() },
        configuration: new QueryForgeConfiguration(
          createConfigurationReader({
            'queryforge.analysis.maxIssues': 25,
            'queryforge.analysis.provider': 'ef-core',
          }),
        ),
        workspace: { asRelativePath: () => 'ProductService.cs' },
      }),
    );

    expect(analyze).toHaveBeenCalledWith(
      expect.objectContaining({
        filePath: 'ProductService.cs',
        languageId: 'csharp',
        provider: 'ef-core',
      }),
      expect.objectContaining({ maxIssues: 25 }),
    );
    expect(setIssueCount).toHaveBeenCalledWith(
      'file:///workspace/ProductService.cs',
      0,
    );
  });

  it('does not show feedback for valid csharp analysis', async () => {
    const analyze = vi.fn().mockReturnValue(createAnalysisResult([]));
    const showInformationMessage = vi.fn();
    const document = createFakeDocument('code', 'file:///a.cs') as PublishableDocument;

    await analyzeCurrentDocument(
      createDeps({
        getActiveEditor: () => ({ document }),
        analysisService: { analyze },
        showInformationMessage,
      }),
    );

    expect(showInformationMessage).not.toHaveBeenCalled();
  });

  it('discards stale results after document version changes', async () => {
    let version = 1;
    const analyze = vi.fn().mockImplementation(() => {
      version = 2;
      return createAnalysisResult([]);
    });
    const publish = vi.fn();
    const document = createFakeDocument('code', 'file:///a.cs', 1) as PublishableDocument & {
      version: number;
    };
    Object.defineProperty(document, 'version', {
      get: () => version,
    });

    await analyzeCurrentDocument(
      createDeps({
        getActiveEditor: () => ({ document }),
        analysisService: { analyze },
        diagnosticService: { publish },
      }),
    );

    expect(publish).not.toHaveBeenCalled();
  });

  it('ignores abort errors', async () => {
    const analyze = vi.fn().mockImplementation(() => {
      const error = new Error('aborted');
      error.name = 'AbortError';
      throw error;
    });
    const clearAnalyzing = vi.fn();
    const document = createFakeDocument('code', 'file:///a.cs') as PublishableDocument;

    await expect(
      analyzeCurrentDocument(
        createDeps({
          getActiveEditor: () => ({ document }),
          analysisService: { analyze },
          statusBar: { setIssueCount: vi.fn(), setAnalyzing: vi.fn(), clearAnalyzing },
        }),
      ),
    ).resolves.toBeUndefined();

    expect(clearAnalyzing).toHaveBeenCalledWith('file:///a.cs');
  });

  it('sets analyzing state while running analysis', async () => {
    const setAnalyzing = vi.fn();
    const setIssueCount = vi.fn();
    const analyze = vi.fn().mockReturnValue(createAnalysisResult([]));
    const document = createFakeDocument('code', 'file:///a.cs') as PublishableDocument;

    await analyzeDocument(
      createDeps({
        analysisService: { analyze },
        diagnosticService: { publish: vi.fn().mockReturnValue(0) },
        statusBar: { setIssueCount, setAnalyzing, clearAnalyzing: vi.fn() },
      }),
      document,
    );

    expect(setAnalyzing).toHaveBeenCalledWith('file:///a.cs');
    expect(setIssueCount).toHaveBeenCalledWith('file:///a.cs', 0);
  });

  it('logs severity summary without code content', async () => {
    const log = vi.fn();
    const analyze = vi.fn().mockReturnValue(
      createAnalysisResult([
        {
          code: 'COUNT_GREATER_THAN_ZERO',
          title: 'Count used to check existence',
          severity: 'medium',
          message: 'message',
          suggestion: 'suggestion',
          confidence: 0.9,
        },
      ]),
    );
    const document = createFakeDocument(
      'await db.Products.CountAsync() > 0;',
      'file:///a.cs',
    ) as PublishableDocument;

    await analyzeDocument(
      createDeps({
        analysisService: { analyze },
        diagnosticService: { publish: vi.fn().mockReturnValue(1) },
        output: { log, warn: vi.fn(), error: vi.fn(), show: vi.fn() },
      }),
      document,
    );

    expect(log).toHaveBeenCalledWith('Found 1 potential issues.');
    expect(log).toHaveBeenCalledWith(expect.stringContaining('Medium: 1'));
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/Analysis completed in \d+ms\./));

    for (const call of log.mock.calls.flat()) {
      expect(String(call)).not.toContain('CountAsync');
    }
  });

  it('does not show popup for save-triggered analysis of invalid language', async () => {
    const showInformationMessage = vi.fn();
    const base = createFakeDocument('text', 'file:///a.ts');
    const document = { ...base, languageId: 'typescript' } as PublishableDocument;

    await analyzeDocument(
      createDeps({ showInformationMessage }),
      document,
      { source: 'save', suppressInvalidEditorMessages: true },
    );

    expect(showInformationMessage).not.toHaveBeenCalled();
  });
});
