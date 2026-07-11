import * as vscode from 'vscode';
import { createStatusBarViewModel, resolveStatusBarState } from './status-bar.js';

export class StatusBarPresenter {
  private readonly item: vscode.StatusBarItem;
  private hasResults = false;
  private lastIssueCount = 0;
  private currentLanguageId: string | undefined;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'queryforge.analyzeCurrentFile';
    this.updateForEditor(undefined);
  }

  updateForEditor(languageId: string | undefined): void {
    this.currentLanguageId = languageId;
    const isCSharp = languageId === 'csharp';
    const state = this.hasResults ? resolveStatusBarState(this.lastIssueCount) : 'idle';
    const viewModel = createStatusBarViewModel(state, this.lastIssueCount, isCSharp);

    this.item.text = viewModel.text;
    this.item.tooltip = viewModel.tooltip;

    if (viewModel.visible) {
      this.item.show();
    } else {
      this.item.hide();
    }
  }

  setIssueCount(count: number): void {
    this.hasResults = true;
    this.lastIssueCount = count;
    const state = resolveStatusBarState(count);
    const viewModel = createStatusBarViewModel(state, count, this.currentLanguageId === 'csharp');
    this.item.text = viewModel.text;

    if (viewModel.visible) {
      this.item.show();
    }
  }

  reset(): void {
    this.hasResults = false;
    this.lastIssueCount = 0;
    this.updateForEditor(this.currentLanguageId);
  }

  dispose(): void {
    this.item.dispose();
  }
}
