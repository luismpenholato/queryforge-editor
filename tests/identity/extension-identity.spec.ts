import { describe, expect, it } from 'vitest';
import {
  QUERYFORGE_EXTENSION_ID,
  QUERYFORGE_EXTENSION_NAME,
  QUERYFORGE_PUBLISHER,
} from '../../src/identity/extension-identity.js';

describe('extension identity', () => {
  it('defines the permanent publisher and extension id', () => {
    expect(QUERYFORGE_PUBLISHER).toBe('queryforge-tools');
    expect(QUERYFORGE_EXTENSION_NAME).toBe('queryforge-editor');
    expect(QUERYFORGE_EXTENSION_ID).toBe('queryforge-tools.queryforge-editor');
  });
});
