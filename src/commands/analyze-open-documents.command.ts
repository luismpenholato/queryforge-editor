import * as vscode from 'vscode';

export function registerAnalyzeOpenDocumentsCommand(
  handler: () => void | Promise<void>,
): vscode.Disposable {
  return vscode.commands.registerCommand('queryforge.analyzeOpenDocuments', () => {
    void handler();
  });
}
