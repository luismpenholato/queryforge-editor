import { QUERYFORGE_EXTENSION_ID } from '../identity/extension-identity.js';

export const SETTINGS_EXTENSION_FILTER = `@ext:${QUERYFORGE_EXTENSION_ID}`;
export const OPEN_SETTINGS_COMMAND = 'workbench.action.openSettings';

export interface OpenSettingsDependencies {
  executeCommand(command: string, ...args: unknown[]): PromiseLike<unknown>;
}

export async function openQueryForgeSettings(deps: OpenSettingsDependencies): Promise<void> {
  await deps.executeCommand(OPEN_SETTINGS_COMMAND, SETTINGS_EXTENSION_FILTER);
}
