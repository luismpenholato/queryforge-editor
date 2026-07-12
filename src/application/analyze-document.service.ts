import type {
  AnalysisOptions,
  QueryAnalysisRequest,
  QueryAnalysisResult,
  QuerySmell,
} from '@luispenholato/queryforge-mcp';
import type { AnalysisCoordinator } from './analysis-coordinator.js';
import { buildAnalysisSummaryLines } from './analysis-summary.js';
import type { PublishableEditorDocument } from '../diagnostics/diagnostic-service.js';
import type { QueryForgeConfiguration } from '../configuration/queryforge-configuration.js';
import type { OutputChannelLogger } from '../presentation/output-channel.js';
import type { MinimumSeverity } from '../diagnostics/severity.js';
import type { DocumentUriLike } from '../diagnostics/diagnostic-range-mapper.js';

export interface PublishableDocument extends PublishableEditorDocument {
  readonly languageId: string;
}

export interface TextEditorLike {
  readonly document: PublishableDocument;
}

export interface WorkspaceLike {
  asRelativePath(
    pathOrUri: string | DocumentUriLike,
    includeWorkspaceFolder?: boolean,
  ): string;
}

export interface AnalysisServiceLike {
  analyze(request: QueryAnalysisRequest, options?: AnalysisOptions): QueryAnalysisResult;
}

export interface DiagnosticServiceLike {
  publish(options: {
    document: PublishableDocument;
    smells: QuerySmell[];
    analyzedCode: string;
    baseOffset: number;
    analysisKind: 'document' | 'selection';
    documentVersion: number;
    minimumSeverity: MinimumSeverity;
    onRangeWarning?: (message: string) => void;
  }): number;
}

export interface StatusBarLike {
  setIssueCount(uri: string, count: number): void;
  setAnalyzing(uri: string): void;
  clearAnalyzing(uri: string): void;
}

export type AnalysisSource = 'manual' | 'save';

export interface AnalyzeDocumentOptions {
  source?: AnalysisSource;
  suppressInvalidEditorMessages?: boolean;
}

export const NO_ACTIVE_EDITOR_MESSAGE = 'Open a C# file before running QueryForge.';
export const NON_CSHARP_FILE_MESSAGE = 'QueryForge currently analyzes C# files only.';

export interface AnalyzeDocumentDependencies {
  getActiveEditor(): TextEditorLike | undefined;
  analysisService: AnalysisServiceLike;
  coordinator: AnalysisCoordinator;
  diagnosticService: DiagnosticServiceLike;
  configuration: QueryForgeConfiguration;
  output: OutputChannelLogger;
  statusBar: StatusBarLike;
  workspace: WorkspaceLike;
  showOnError: boolean;
  showInformationMessage(message: string): void;
}

export function resolveAnalysisFilePath(
  documentUri: DocumentUriLike,
  workspace: WorkspaceLike,
): string {
  try {
    const relative = workspace.asRelativePath(documentUri, false);
    if (relative && !relative.startsWith('/') && !/^[A-Za-z]:\\/.test(relative)) {
      return relative;
    }
  } catch {
    // fall through to basename
  }

  const fullPath = documentUri.fsPath ?? documentUri.path ?? documentUri.toString();
  const segments = fullPath.replace(/\\/g, '/').split('/');
  return segments[segments.length - 1] ?? 'document.cs';
}

export async function analyzeCurrentDocument(
  deps: AnalyzeDocumentDependencies,
  options: AnalyzeDocumentOptions = {},
): Promise<void> {
  const editor = deps.getActiveEditor();
  if (!editor) {
    if (!options.suppressInvalidEditorMessages) {
      deps.showInformationMessage(NO_ACTIVE_EDITOR_MESSAGE);
    }
    return;
  }

  await analyzeDocument(deps, editor.document, options);
}

export async function analyzeDocument(
  deps: AnalyzeDocumentDependencies,
  document: PublishableDocument,
  options: AnalyzeDocumentOptions = {},
): Promise<void> {
  if (document.languageId !== 'csharp') {
    if (!options.suppressInvalidEditorMessages) {
      deps.showInformationMessage(NON_CSHARP_FILE_MESSAGE);
    }
    return;
  }

  const uri = document.uri.toString();
  const initialVersion = document.version;
  const filePath = resolveAnalysisFilePath(document.uri, deps.workspace);
  const displayName = filePath;

  const controller = deps.coordinator.beginAnalysis(uri, initialVersion, 'document');
  deps.statusBar.setAnalyzing(uri);
  const startedAt = Date.now();

  deps.output.log(`Analyzing ${displayName}...`);

  try {
    const settings = deps.configuration.getSettings();
    const result = deps.analysisService.analyze(
      {
        code: document.getText(),
        filePath,
        languageId: 'csharp',
        provider: settings.provider,
      },
      {
        signal: controller.signal,
        maxIssues: settings.maxIssues,
      },
    );

    if (document.version !== initialVersion) {
      deps.output.log(`Discarded stale analysis result for ${displayName}.`);
      deps.statusBar.clearAnalyzing(uri);
      return;
    }

    if (deps.coordinator.isStaleResult(uri, initialVersion, 'document')) {
      deps.statusBar.clearAnalyzing(uri);
      return;
    }

    const issueCount = deps.diagnosticService.publish({
      document,
      smells: result.smells,
      analyzedCode: document.getText(),
      baseOffset: 0,
      analysisKind: 'document',
      documentVersion: initialVersion,
      minimumSeverity: settings.minimumSeverity,
      onRangeWarning: (message) => deps.output.warn(message),
    });

    const elapsed = Date.now() - startedAt;
    deps.statusBar.setIssueCount(uri, issueCount);

    for (const line of buildAnalysisSummaryLines({
      smells: result.smells,
      minimumSeverity: settings.minimumSeverity,
      issueCount,
    })) {
      deps.output.log(line);
    }

    deps.output.log(`Analysis completed in ${elapsed}ms.`);
  } catch (error) {
    deps.statusBar.clearAnalyzing(uri);

    if (isAbortError(error)) {
      return;
    }

    deps.output.error('Analysis failed.', error);
    if (deps.showOnError) {
      deps.output.show(true);
    }
  } finally {
    deps.coordinator.finishAnalysis(uri, controller);
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}
