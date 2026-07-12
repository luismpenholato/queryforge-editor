import * as vscode from 'vscode';
import { createStatusBarViewModel } from './status-bar.js';
import { PerDocumentIssueCounts } from './status-bar-state.js';

export class StatusBarPresenter {
  private readonly item: vscode.StatusBarItem;
  private readonly issueCounts = new PerDocumentIssueCounts();
  private activeEditor: { uri: vscode.Uri; languageId: string } | undefined;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'queryforge.analyzeCurrentFile';
    this.updateForEditor(undefined);
  }

  updateForEditor(
    editor?: {
      document: {
        uri: vscode.Uri;
        languageId: string;
      };
    },
  ): void {
    this.activeEditor = editor?.document;
    this.render();
  }

  setAnalyzing(uri: string): void {
    this.issueCounts.setAnalyzing(uri);
    this.render();
  }

  clearAnalyzing(uri: string): void {
    this.issueCounts.clearAnalyzing(uri);
    this.render();
  }

  setIssueCount(uri: string, count: number): void {
    this.issueCounts.setIssueCount(uri, count);
    this.render();
  }

  clearIssueCount(uri: string): void {
    this.issueCounts.clearIssueCount(uri);
    this.render();
  }

  reset(): void {
    this.issueCounts.reset();
    this.render();
  }

  dispose(): void {
    this.item.dispose();
  }

  private render(): void {
    const activeUri = this.activeEditor?.uri.toString();
    const languageId = this.activeEditor?.languageId;
    const { state, issueCount, visible } = this.issueCounts.resolveActiveView(
      activeUri,
      languageId,
    );
    const viewModel = createStatusBarViewModel(state, issueCount, visible);

    this.item.text = viewModel.text;
    this.item.tooltip = viewModel.tooltip;

    if (viewModel.visible) {
      this.item.show();
    } else {
      this.item.hide();
    }
  }
}
