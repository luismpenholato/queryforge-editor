import { describe, expect, it } from 'vitest';
import { ensureChangelogReleaseLinks } from '../../scripts/ensure-changelog-release-links.mjs';

describe('ensureChangelogReleaseLinks', () => {
  it('appends missing release links for changelog sections', () => {
    const input = `# Changelog

## [0.1.2] - 2026-11-22

### Added

- Something

## [0.1.1] - 2026-07-12

### Changed

- Something else

[0.1.1]: https://github.com/luismpenholato/queryforge-editor/releases/tag/v0.1.1
`;

    const result = ensureChangelogReleaseLinks(input);

    expect(result.changed).toBe(true);
    expect(result.added).toEqual(['0.1.2']);
    expect(result.changelog).toContain(
      '[0.1.2]: https://github.com/luismpenholato/queryforge-editor/releases/tag/v0.1.2',
    );
    expect(result.changelog).toContain(
      '[0.1.1]: https://github.com/luismpenholato/queryforge-editor/releases/tag/v0.1.1',
    );
  });

  it('is a no-op when all links already exist', () => {
    const input = `# Changelog

## [0.1.2] - 2026-11-22

### Added

- Something

[0.1.2]: https://github.com/luismpenholato/queryforge-editor/releases/tag/v0.1.2
`;

    const result = ensureChangelogReleaseLinks(input);

    expect(result.changed).toBe(false);
    expect(result.added).toEqual([]);
    expect(result.changelog).toBe(input);
  });
});
