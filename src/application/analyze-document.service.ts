import type {
  AnalysisOptions,
  QueryAnalysisRequest,
  QueryAnalysisResult,
  QuerySmell,
} from '@luispenholato/queryforge-mcp';
import type { AnalysisCoordinator } from './analysis-coordinator.js';
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
  setIssueCount(count: number): void;
}

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
): Promise<void> {
  const editor = deps.getActiveEditor();
  if (!editor) {
    return;
  }

  const document = editor.document;
  if (document.languageId !== 'csharp') {
    return;
  }

  const uri = document.uri.toString();
  const initialVersion = document.version;
  const filePath = resolveAnalysisFilePath(document.uri, deps.workspace);
  const displayName = filePath;

  const controller = deps.coordinator.beginAnalysis(uri, initialVersion, 'document');
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
      return;
    }

    if (deps.coordinator.isStaleResult(uri, initialVersion, 'document')) {
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
    deps.statusBar.setIssueCount(issueCount);
    deps.output.log(
      issueCount > 0
        ? `Found ${issueCount} potential issues. Overall severity: ${result.severity}.`
        : 'Found 0 potential issues.',
    );
    deps.output.log(`Analysis completed in ${elapsed}ms.`);
  } catch (error) {
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
