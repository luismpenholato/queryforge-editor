import * as vscode from 'vscode';
import type { ExtensionContext } from 'vscode';
import { QueryAnalysisService } from '@luispenholato/queryforge-mcp';
import { AnalysisCoordinator } from './application/analysis-coordinator.js';
import {
  analyzeCurrentDocument,
  analyzeDocument,
} from './application/analyze-document.service.js';
import { analyzeCurrentSelection } from './application/analyze-selection.service.js';
import {
  handleDocumentChanged,
  handleDocumentClosed,
} from './application/document-lifecycle.js';
import { openQueryForgeExample } from './application/open-example.service.js';
import { openQueryForgeSettings } from './application/open-settings.service.js';
import { shouldAnalyzeDocumentOnSave } from './application/save-analysis.handler.js';
import { registerAnalyzeCurrentFileCommand } from './commands/analyze-current-file.command.js';
import { registerAnalyzeSelectionCommand } from './commands/analyze-selection.command.js';
import { registerClearDiagnosticsCommand } from './commands/clear-diagnostics.command.js';
import { registerOpenExampleCommand } from './commands/open-example.command.js';
import { registerOpenSettingsCommand } from './commands/open-settings.command.js';
import { registerShowOutputCommand } from './commands/show-output.command.js';
import { registerSupportProjectCommand } from './commands/support-project.command.js';
import {
  QueryForgeCodeActionProvider,
  applySafeFix,
} from './code-actions/queryforge-code-action-provider.js';
import {
  createVscodeConfigurationReader,
  QueryForgeConfiguration,
} from './configuration/queryforge-configuration.js';
import { DiagnosticMetadataStore } from './diagnostics/diagnostic-metadata-store.js';
import { DiagnosticService } from './diagnostics/diagnostic-service.js';
import { QueryForgeHoverProvider } from './hovers/queryforge-hover-provider.js';
import { createOutputChannelLogger } from './presentation/output-channel.js';
import { StatusBarPresenter } from './presentation/status-bar-presenter.js';

interface ExtensionServices {
  analysisService: QueryAnalysisService;
  coordinator: AnalysisCoordinator;
  metadataStore: DiagnosticMetadataStore;
  diagnosticService: DiagnosticService;
  configuration: QueryForgeConfiguration;
  output: ReturnType<typeof createOutputChannelLogger>;
  statusBar: StatusBarPresenter;
  outputChannel: vscode.OutputChannel;
}

let services: ExtensionServices | undefined;

function createDocumentLifecycleActions(
  coordinator: AnalysisCoordinator,
  diagnosticService: DiagnosticService,
  statusBar: StatusBarPresenter,
) {
  return {
    abortByUri(uri: string) {
      coordinator.abortByUri(uri);
      statusBar.clearAnalyzing(uri);
    },
    clearDiagnostics(uri: string) {
      diagnosticService.clearByUri(vscode.Uri.parse(uri));
    },
    clearIssueCount(uri: string) {
      statusBar.clearIssueCount(uri);
    },
    hasQueryForgeState(uri: string) {
      return (
        diagnosticService.hasForUri(vscode.Uri.parse(uri)) ||
        coordinator.hasActiveAnalysis(uri)
      );
    },
  };
}

export function activate(context: ExtensionContext): void {
  const outputChannel = vscode.window.createOutputChannel('QueryForge');
  const output = createOutputChannelLogger(outputChannel);
  const statusBar = new StatusBarPresenter();
  const metadataStore = new DiagnosticMetadataStore();
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('queryforge');
  const diagnosticService = new DiagnosticService(diagnosticCollection, metadataStore);
  const coordinator = new AnalysisCoordinator();
  const analysisService = new QueryAnalysisService();
  const configuration = new QueryForgeConfiguration(
    createVscodeConfigurationReader((section) => vscode.workspace.getConfiguration(section)),
  );
  const lifecycleActions = createDocumentLifecycleActions(
    coordinator,
    diagnosticService,
    statusBar,
  );

  services = {
    analysisService,
    coordinator,
    metadataStore,
    diagnosticService,
    configuration,
    output,
    statusBar,
    outputChannel,
  };

  const showInformationMessage = (message: string) => {
    void vscode.window.showInformationMessage(message);
  };

  const sharedDeps = () => {
    if (!services) {
      throw new Error('QueryForge extension is not activated.');
    }

    const settings = services.configuration.getSettings();

    return {
      analysisService: services.analysisService,
      coordinator: services.coordinator,
      diagnosticService: services.diagnosticService,
      configuration: services.configuration,
      output: services.output,
      statusBar: services.statusBar,
      workspace: vscode.workspace,
      showOnError: settings.showOnError,
      showInformationMessage,
    };
  };

  context.subscriptions.push(
    outputChannel,
    diagnosticCollection,
    statusBar,
    registerAnalyzeCurrentFileCommand(() =>
      analyzeCurrentDocument({
        ...sharedDeps(),
        getActiveEditor: () => vscode.window.activeTextEditor,
      }),
    ),
    registerAnalyzeSelectionCommand(() =>
      analyzeCurrentSelection({
        ...sharedDeps(),
        getActiveEditor: () => vscode.window.activeTextEditor,
      }),
    ),
    registerOpenExampleCommand(() =>
      openQueryForgeExample({
        openTextDocument: (options) => vscode.workspace.openTextDocument(options),
        showTextDocument: (document) =>
          vscode.window.showTextDocument(document as vscode.TextDocument),
        showInformationMessage: (message, ...actions) =>
          vscode.window.showInformationMessage(message, ...actions),
        executeCommand: (command) => vscode.commands.executeCommand(command),
      }),
    ),
    registerOpenSettingsCommand(() =>
      openQueryForgeSettings({
        executeCommand: (command, ...args) => vscode.commands.executeCommand(command, ...args),
      }),
    ),
    registerClearDiagnosticsCommand(() => {
      coordinator.abortAll();
      diagnosticService.clearAll();
      statusBar.reset();
      output.log('Diagnostics cleared.');
    }),
    registerShowOutputCommand(() => {
      outputChannel.show(true);
    }),
    registerSupportProjectCommand(() => {
      void vscode.env.openExternal(vscode.Uri.parse('https://github.com/sponsors/luismpenholato'));
    }),
    vscode.commands.registerCommand(
      'queryforge.applySafeFix',
      (uriString: string, expectedVersion: number, edits: Array<{ startOffset: number; endOffset: number; newText: string }>) =>
        applySafeFix(uriString, expectedVersion, edits, output),
    ),
    vscode.languages.registerHoverProvider(
      { language: 'csharp' },
      new QueryForgeHoverProvider(metadataStore),
    ),
    vscode.languages.registerCodeActionsProvider(
      { language: 'csharp' },
      new QueryForgeCodeActionProvider(metadataStore, output),
      {
        providedCodeActionKinds: QueryForgeCodeActionProvider.providedCodeActionKinds,
      },
    ),
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      statusBar.updateForEditor(editor);
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      handleDocumentChanged(
        {
          uri: event.document.uri.toString(),
          languageId: event.document.languageId,
          contentChangeCount: event.contentChanges.length,
        },
        lifecycleActions,
      );

      if (
        vscode.window.activeTextEditor?.document.uri.toString() ===
        event.document.uri.toString()
      ) {
        statusBar.updateForEditor(vscode.window.activeTextEditor);
      }
    }),
    vscode.workspace.onDidCloseTextDocument((document) => {
      handleDocumentClosed(
        { uri: document.uri.toString() },
        lifecycleActions,
      );

      if (
        vscode.window.activeTextEditor?.document.uri.toString() ===
        document.uri.toString()
      ) {
        statusBar.updateForEditor(vscode.window.activeTextEditor);
      }
    }),
    vscode.workspace.onDidSaveTextDocument((document) => {
      const settings = configuration.getSettings();

      if (!shouldAnalyzeDocumentOnSave(document, settings.runOnSave)) {
        return;
      }

      void analyzeDocument(
        {
          ...sharedDeps(),
          getActiveEditor: () => vscode.window.activeTextEditor,
        },
        document,
        {
          source: 'save',
          suppressInvalidEditorMessages: true,
        },
      );
    }),
  );

  statusBar.updateForEditor(vscode.window.activeTextEditor);
}

export function deactivate(): void {
  services?.coordinator.abortAll();
  services?.metadataStore.clearAll();
  services = undefined;
}
