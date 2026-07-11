import * as vscode from 'vscode';

export function registerClearDiagnosticsCommand(
  handler: () => void | Promise<void>,
): vscode.Disposable {
  return vscode.commands.registerCommand('queryforge.clearDiagnostics', () => {
    void handler();
  });
}
