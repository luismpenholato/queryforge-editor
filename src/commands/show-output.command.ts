import * as vscode from 'vscode';

export function registerShowOutputCommand(
  handler: () => void | Promise<void>,
): vscode.Disposable {
  return vscode.commands.registerCommand('queryforge.showOutput', () => {
    void handler();
  });
}
