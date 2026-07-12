# QueryForge — EF & LINQ Analyzer

[![CI](https://github.com/luismpenholato/queryforge-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/luismpenholato/queryforge-editor/actions/workflows/ci.yml)
[![GitHub release](https://img.shields.io/github/v/release/luismpenholato/queryforge-editor)](https://github.com/luismpenholato/queryforge-editor/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 20](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Sponsor](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/luismpenholato)

QueryForge detects risky LINQ and Entity Framework query patterns directly in your editor. Analysis runs locally and provides diagnostics, detailed guidance and safe quick fixes.

Built for VS Code and editors compatible with the VS Code extension ecosystem.

## Try it in 30 seconds

1. Open the Command Palette.
2. Run `QueryForge: Open Example`.
3. Click **Analyze Example**.
4. Review the findings in the editor or Problems Panel.
5. Use the lightbulb action on a diagnostic with a safe fix.

## Quick start

1. Open a C# file.
2. Run `QueryForge: Analyze Current File`.
3. Review findings in the editor or Problems Panel.
4. Open the diagnostic details.
5. Apply a safe Quick Fix when available.

## Example

Before:

```csharp
var exists = await db.Products.CountAsync() > 0;
```

QueryForge reports `COUNT_GREATER_THAN_ZERO` and suggests:

```csharp
var exists = await db.Products.AnyAsync();
```

Another pattern without a safe fix:

```csharp
var products = await db.Products
    .Where(product => product.CreatedAt.Year == year)
    .ToListAsync();
```

QueryForge reports a function-on-column filter and recommends rewriting it as a date range. This requires review and is not automatically applied.

Not every diagnostic includes a Quick Fix. Review-required suggestions stay in hover guidance and the Problems Panel.

## Features

- Analyze the current C# file on demand
- Analyze only the selected C# query or expression
- Built-in fictional C# example for quick evaluation
- Native Getting Started walkthrough
- Diagnostics in the editor and Problems Panel
- Detailed hover guidance with explanation, suggestion and rewrite plan
- Safe Quick Fix actions for fixes marked as `safe`
- Optional analyze-on-save for saved C# files
- Output Channel with concise analysis summaries
- Status bar shortcut with per-document analysis state

## Commands

| Command | Description |
| --- | --- |
| `QueryForge: Analyze Current File` | Analyze the active C# document |
| `QueryForge: Analyze Current Selection` | Analyze the selected C# text |
| `QueryForge: Open Example` | Open a built-in fictional C# example |
| `QueryForge: Open Settings` | Open QueryForge extension settings |
| `QueryForge: Clear Diagnostics` | Clear QueryForge diagnostics and metadata |
| `QueryForge: Show Output` | Open the QueryForge output channel |
| `QueryForge: Support the Project` | Open GitHub Sponsors |

## Current capabilities

| Capability | Available |
| --- | --- |
| Analyze current C# file | Yes |
| Analyze selected code | Yes |
| Editor diagnostics | Yes |
| Problems Panel | Yes |
| Detailed hover guidance | Yes |
| Safe Quick Fixes | When provided by the Core |
| Analyze on save | Optional |
| Workspace analysis | Not yet |
| Roslyn semantic analysis | No |
| Database connection | No |
| SQL execution | No |

## Supported patterns

QueryForge focuses on common query-performance smells, including:

- early materialization
- tracking overhead
- existence checks using `Count`
- unstable pagination and ordering
- non-sargable filters
- large `Take` operations
- structural N+1 and round-trip patterns
- unnecessary includes
- client-side query behavior

The extension consumes the local programmatic API from [QueryForge MCP/Core](https://github.com/luismpenholato/queryforge-mcp). It does not start the MCP server.

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
| `queryforge.analysis.runOnSave` | `false` | Analyze saved C# files automatically on save |
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
