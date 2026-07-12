import { describe, expect, it, vi } from 'vitest';
import {
  OPEN_SETTINGS_COMMAND,
  SETTINGS_EXTENSION_FILTER,
  openQueryForgeSettings,
} from '../../src/application/open-settings.service.js';
import { QUERYFORGE_EXTENSION_ID } from '../../src/identity/extension-identity.js';

describe('open-settings.service', () => {
  it('opens settings filtered by extension id', async () => {
    const executeCommand = vi.fn().mockResolvedValue(undefined);

    await openQueryForgeSettings({ executeCommand });

    expect(SETTINGS_EXTENSION_FILTER).toBe(`@ext:${QUERYFORGE_EXTENSION_ID}`);
    expect(executeCommand).toHaveBeenCalledWith(
      OPEN_SETTINGS_COMMAND,
      '@ext:queryforge.queryforge-editor',
    );
  });
});
