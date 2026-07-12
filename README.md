# QueryForge — EF & LINQ Analyzer

[![CI](https://github.com/luismpenholato/queryforge-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/luismpenholato/queryforge-editor/actions/workflows/ci.yml)
[![GitHub release](https://img.shields.io/github/v/release/luismpenholato/queryforge-editor)](https://github.com/luismpenholato/queryforge-editor/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 20](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/luismpenholato)

QueryForge detects risky LINQ and Entity Framework query patterns directly in your editor. Analysis runs locally and provides diagnostics, detailed guidance and safe quick fixes.

Built for VS Code and editors compatible with the VS Code extension ecosystem.

## Quick start

1. Open a C# file.
2. Run `QueryForge: Analyze Current File`.
3. Review findings in the editor or Problems Panel.
4. Open the diagnostic details.
5. Apply a safe Quick Fix when available.

## Features

- Analyze the current C# file on demand
- Analyze only the selected C# query or expression
- Diagnostics in the editor and Problems Panel
- Detailed hover guidance with explanation, suggestion and rewrite plan
- Safe Quick Fix actions for fixes marked as `safe`
- Output Channel with concise analysis logs
- Status bar shortcut for running analysis in C# files

## Commands

| Command | Description |
| --- | --- |
| `QueryForge: Analyze Current File` | Analyze the active C# document |
| `QueryForge: Analyze Current Selection` | Analyze the selected C# text |
| `QueryForge: Clear Diagnostics` | Clear QueryForge diagnostics and metadata |
| `QueryForge: Show Output` | Open the QueryForge output channel |
| `QueryForge: Support the Project` | Open GitHub Sponsors |

## Diagnostics

Each QueryForge diagnostic includes:

- severity mapped from QueryForge levels
- rule code
- concise message
- source set to `QueryForge`

Hover over a diagnostic to see explanation, suggestion, rewrite plan and confidence.

Diagnostics are cleared when the document changes. Run the analysis again to refresh the results.

## Safe fixes

Quick Fix actions are offered only when `fix.safety === "safe"`.

Review-required fixes are never applied automatically.

If the document changed after analysis, the extension blocks stale fixes and asks you to run analysis again.

## How it works

QueryForge Editor reads the current C# text and calls the local QueryForge analysis library. It does not start the MCP server.

Flow:

```text
C# editor text → QueryAnalysisService → QuerySmell[] → diagnostics → hover → safe Quick Fix
```

## Supported editors

Target environments:

- Visual Studio Code
- Cursor
- Antigravity

Availability depends on marketplace distribution and editor compatibility.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `queryforge.analysis.provider` | `ef-core` | Provider context passed to the analyzer |
| `queryforge.analysis.maxIssues` | `100` | Maximum diagnostics per analysis |
| `queryforge.diagnostics.minimumSeverity` | `info` | Minimum severity shown in the editor |
| `queryforge.output.showOnError` | `true` | Open output channel on analysis errors |

## Privacy

QueryForge analyzes source text locally. The analysis does not upload source code, connect to databases or execute SQL.

The extension does not use telemetry, analytics, AI services or login.

## Limitations

- Heuristic analysis can produce false positives
- No Roslyn semantic analysis
- Does not validate generated SQL or execution plans
- Safe fixes are intentionally limited
- Human review remains necessary

## Development

Requirements:

- Node.js 20+

```bash
git clone https://github.com/luismpenholato/queryforge-editor.git
cd queryforge-editor
npm ci
npm run validate
```

Press `F5` in VS Code/Cursor to launch the Extension Development Host.

## Community

- [Report a bug](https://github.com/luismpenholato/queryforge-editor/issues/new?template=bug_report.yml)
- [Request a feature](https://github.com/luismpenholato/queryforge-editor/issues/new?template=feature_request.yml)
- [Security advisories](https://github.com/luismpenholato/queryforge-editor/security/advisories/new)

## Support the project

If QueryForge Editor helps your daily work, consider supporting ongoing development:

[GitHub Sponsors](https://github.com/sponsors/luismpenholato)

## License

MIT © Luis Mauro Penholato
