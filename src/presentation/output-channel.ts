import * as vscode from 'vscode';

export interface OutputChannelLogger {
  log(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
  show(preserveFocus?: boolean): void;
}

export function createOutputChannelLogger(channel: vscode.OutputChannel): OutputChannelLogger {
  return {
    log(message: string) {
      channel.appendLine(`[QueryForge] ${message}`);
    },
    warn(message: string) {
      channel.appendLine(`[QueryForge] Warning: ${message}`);
    },
    error(message: string, error?: unknown) {
      channel.appendLine(`[QueryForge] Error: ${message}`);
      if (error instanceof Error && error.message) {
        channel.appendLine(`[QueryForge] ${error.message}`);
      }
    },
    show(preserveFocus = true) {
      channel.show(preserveFocus);
    },
  };
}
