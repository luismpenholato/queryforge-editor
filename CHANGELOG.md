# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- Improved Open Example onboarding message to mention Core 0.8.x Dapper smells and the `dapper` provider setting.
- Clarified the 30-second try-it flow for Dapper provider context and rule codes.

## [0.1.4] - 2026-11-22

### Changed

- Clarified Getting Started walkthrough and Open Example onboarding for Core 0.8.x Dapper smells (`SELECT *`, query-in-loop, string-concat SQL).
- Expanded false-positive guidance with dedicated rows for `DAPPER_SELECT_STAR`, `DAPPER_QUERY_IN_LOOP` and `DAPPER_STRING_CONCAT_SQL`.
- Aligned the Core dependency to `@luispenholato/queryforge-mcp@^0.8.1`.
- Bumped development tooling: `@types/node` `^22.20.5` and `ovsx` `^1.4.0` (kept `@types/vscode` aligned with `engines.vscode`).
- Updated the version compatibility matrix for Editor `0.1.4` / Core `0.8.1`.

## [0.1.3] - 2026-11-22

### Changed

- Aligned the Core dependency to `@luispenholato/queryforge-mcp@^0.8.0`.
- Documented Core 0.8.0 Dapper safety and aggregation smell rules in the supported-patterns guidance.
- Updated the version compatibility matrix for Editor `0.1.3` / Core `0.8.0`.

## [0.1.2] - 2026-11-22

### Added

- Added `QueryForge: Analyze Open Documents` to analyze every open C# file in one pass.
- Added false-positive guidance and a version compatibility matrix with QueryForge MCP/Core.

### Changed

- Aligned the Core dependency to `@luispenholato/queryforge-mcp@^0.7.1`.
- Clarified positioning: local developer tooling with optional Sponsors support, not a Sponsors product.
- Auto-generate missing Keep a Changelog release footer links during release validation.

## [0.1.1] - 2026-07-12

### Added

- Added marketplace badges for Visual Studio Marketplace and Open VSX.
- Added install instructions for marketplace, Extensions view, Command Palette and VSIX.

### Changed

- Aligned the publish workflow with the Nebula Aura Theme release flow: tag, marketplace publish and GitHub Release.

## [0.1.0] - 2026-07-11

### Added

- Added local analysis for the current C# file and selected code.
- Added QueryForge diagnostics to the editor and Problems Panel.
- Added detailed hover guidance for detected query smells.
- Added safe Quick Fix support using structured QueryForge edits.
- Added Output Channel and status bar integrations.
- Added configurable provider, issue limit and minimum severity.
- Added support links and local-first privacy documentation.
- Added CI, VSIX packaging and marketplace publishing workflows.
- Added a built-in fictional C# example for quickly trying QueryForge.
- Added a native Getting Started walkthrough.
- Added an optional analyze-on-save setting.
- Added a command for opening QueryForge settings.
- Added per-document analysis progress in the status bar.
- Added severity and safe-fix summaries to the Output Channel.

### Changed

- Improved per-document status bar state.
- Clear stale diagnostics when analyzed documents change or close.
- Added clearer feedback when analysis is requested without an active C# file.
- Improved Marketplace description and extension package validation.
- Optimized the extension icon for Marketplace distribution.
- Expanded documentation with usage examples and a quick-start workflow.
- Improved VSIX bundle validation markers.
- Set the permanent Marketplace and Open VSX publisher to `queryforge-tools`.
- Finalized the extension identifier as `queryforge-tools.queryforge-editor`.
- Removed the preview Marketplace label for the initial public release.

### Fixed

- Fixed cross-platform VSIX validation by reading the package as a ZIP archive.
- Validated the packaged extension manifest instead of only the local package metadata.

[0.1.4]: https://github.com/luismpenholato/queryforge-editor/releases/tag/v0.1.4
[0.1.3]: https://github.com/luismpenholato/queryforge-editor/releases/tag/v0.1.3
[0.1.2]: https://github.com/luismpenholato/queryforge-editor/releases/tag/v0.1.2
[0.1.1]: https://github.com/luismpenholato/queryforge-editor/releases/tag/v0.1.1
[0.1.0]: https://github.com/luismpenholato/queryforge-editor/releases/tag/v0.1.0
