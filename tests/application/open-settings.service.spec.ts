import { describe, expect, it, vi } from 'vitest';
import {
  OPEN_SETTINGS_COMMAND,
  SETTINGS_EXTENSION_FILTER,
  openQueryForgeSettings,
} from '../../src/application/open-settings.service.js';

describe('open-settings.service', () => {
  it('opens settings filtered by extension id', async () => {
    const executeCommand = vi.fn().mockResolvedValue(undefined);

    await openQueryForgeSettings({ executeCommand });

    expect(executeCommand).toHaveBeenCalledWith(
      OPEN_SETTINGS_COMMAND,
      SETTINGS_EXTENSION_FILTER,
    );
  });
});
