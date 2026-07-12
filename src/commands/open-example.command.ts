import * as vscode from 'vscode';

export function registerOpenExampleCommand(
  handler: () => void | Promise<void>,
): vscode.Disposable {
  return vscode.commands.registerCommand('queryforge.openExample', () => {
    void handler();
  });
}
