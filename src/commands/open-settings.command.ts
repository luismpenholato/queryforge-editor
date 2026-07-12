import * as vscode from 'vscode';

export function registerOpenSettingsCommand(
  handler: () => void | Promise<void>,
): vscode.Disposable {
  return vscode.commands.registerCommand('queryforge.openSettings', () => {
    void handler();
  });
}
