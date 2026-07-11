import * as vscode from 'vscode';

export function registerSupportProjectCommand(
  handler: () => void | Promise<void>,
): vscode.Disposable {
  return vscode.commands.registerCommand('queryforge.supportProject', () => {
    void handler();
  });
}
