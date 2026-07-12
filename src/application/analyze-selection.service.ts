import type * as vscode from 'vscode';
import type { AnalysisCoordinator } from './analysis-coordinator.js';
import { buildAnalysisSummaryLines } from './analysis-summary.js';
import type { QueryForgeConfiguration } from '../configuration/queryforge-configuration.js';
import type { OutputChannelLogger } from '../presentation/output-channel.js';
import {
  NON_CSHARP_FILE_MESSAGE,
  NO_ACTIVE_EDITOR_MESSAGE,
  resolveAnalysisFilePath,
  type AnalysisServiceLike,
  type DiagnosticServiceLike,
  type PublishableDocument,
  type StatusBarLike,
  type TextEditorLike,
  type WorkspaceLike,
} from './analyze-document.service.js';

export interface TextSelectionLike {
  readonly start: vscode.Position;
  readonly end: vscode.Position;
  isEmpty: boolean;
}

export interface SelectionEditorLike extends TextEditorLike {
  readonly selection: TextSelectionLike;
  readonly document: PublishableDocument;
}

export interface AnalyzeSelectionDependencies {
  getActiveEditor(): SelectionEditorLike | undefined;
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

export async function analyzeCurrentSelection(
  deps: AnalyzeSelectionDependencies,
): Promise<void> {
  const editor = deps.getActiveEditor();
  if (!editor) {
    deps.showInformationMessage(NO_ACTIVE_EDITOR_MESSAGE);
    return;
  }

  const document = editor.document;
  if (document.languageId !== 'csharp') {
    deps.showInformationMessage(NON_CSHARP_FILE_MESSAGE);
    return;
  }

  if (editor.selection.isEmpty) {
    deps.showInformationMessage(
      'Select a C# query or expression before running this command.',
    );
    return;
  }

  const uri = document.uri.toString();
  const initialVersion = document.version;
  const selectedText = document.getText(editor.selection);
  const baseOffset = document.offsetAt(editor.selection.start);
  const filePath = resolveAnalysisFilePath(document.uri, deps.workspace);
  const displayName = filePath;

  const controller = deps.coordinator.beginAnalysis(uri, initialVersion, 'selection');
  deps.statusBar.setAnalyzing(uri);
  const startedAt = Date.now();

  deps.output.log(`Analyzing selection in ${displayName}...`);

  try {
    const settings = deps.configuration.getSettings();
    const result = deps.analysisService.analyze(
      {
        code: selectedText,
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
      deps.output.log(`Discarded stale selection analysis for ${displayName}.`);
      deps.statusBar.clearAnalyzing(uri);
      return;
    }

    if (deps.coordinator.isStaleResult(uri, initialVersion, 'selection')) {
      deps.statusBar.clearAnalyzing(uri);
      return;
    }

    const issueCount = deps.diagnosticService.publish({
      document,
      smells: result.smells,
      analyzedCode: selectedText,
      baseOffset,
      analysisKind: 'selection',
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

    deps.output.error('Selection analysis failed.', error);
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
