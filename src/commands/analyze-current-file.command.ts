import * as vscode from 'vscode';

export function registerAnalyzeCurrentFileCommand(
  handler: () => void | Promise<void>,
): vscode.Disposable {
  return vscode.commands.registerCommand('queryforge.analyzeCurrentFile', () => {
    void handler();
  });
}
