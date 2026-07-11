import * as vscode from 'vscode';

export function registerAnalyzeSelectionCommand(
  handler: () => void | Promise<void>,
): vscode.Disposable {
  return vscode.commands.registerCommand('queryforge.analyzeSelection', () => {
    void handler();
  });
}
