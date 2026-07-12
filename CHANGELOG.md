# Changelog

All notable changes to this project will be documented in this file.

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

### Fixed

- Fixed cross-platform VSIX validation by reading the package as a ZIP archive.
- Validated the packaged extension manifest instead of only the local package metadata.

[0.1.0]: https://github.com/luismpenholato/queryforge-editor/releases/tag/v0.1.0
