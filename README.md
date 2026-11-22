# QueryForge — EF & LINQ Analyzer

[![CI](https://github.com/luismpenholato/queryforge-editor/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/luismpenholato/queryforge-editor/actions/workflows/ci.yml)
[![VS Marketplace Version](https://vsmarketplacebadges.dev/version/queryforge-tools.queryforge-editor.svg?label=VS%20Marketplace)](https://marketplace.visualstudio.com/items?itemName=queryforge-tools.queryforge-editor)
[![VS Marketplace Installs](https://vsmarketplacebadges.dev/installs/queryforge-tools.queryforge-editor.svg?label=Installs)](https://marketplace.visualstudio.com/items?itemName=queryforge-tools.queryforge-editor)
[![Open VSX Version](https://img.shields.io/open-vsx/v/queryforge-tools/queryforge-editor?label=Open%20VSX)](https://open-vsx.org/extension/queryforge-tools/queryforge-editor)
[![Open VSX Downloads](https://img.shields.io/open-vsx/dt/queryforge-tools/queryforge-editor?label=Downloads)](https://open-vsx.org/extension/queryforge-tools/queryforge-editor)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/luismpenholato?label=Sponsor&logo=githubsponsors&logoColor=white&color=ea4aaa)](https://github.com/sponsors/luismpenholato)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

QueryForge detects risky LINQ and Entity Framework query patterns directly in your editor. Analysis runs locally and provides diagnostics, detailed guidance and safe quick fixes.

Built for VS Code and editors compatible with the VS Code extension ecosystem.

This is free local developer tooling. GitHub Sponsors is optional support for maintenance — QueryForge is not a Sponsors-gated product.

[Install](#install) · [Try it](#try-it-in-30-seconds) · [Example](#example) · [Ecosystem](#queryforge-ecosystem) · [Configuration](#configuration) · [When not to trust a finding](#when-not-to-trust-a-finding) · [Development](#development)

Analysis is heuristic, not Roslyn semantic analysis. A diagnostic is a review aid, not proof of a performance problem; validate changes against your tests and generated SQL.

## Install

[Install from Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=queryforge-tools.queryforge-editor) ·
[Install from Open VSX](https://open-vsx.org/extension/queryforge-tools/queryforge-editor)

Or open the Extensions view (`Ctrl+Shift+X`), search for **QueryForge**, and install `queryforge-tools.queryforge-editor`.

You can also install from the Command Palette (`Ctrl+Shift+P`):

```text
ext install queryforge-tools.queryforge-editor
```

### Install from VSIX

Download the `.vsix` from [GitHub Releases](https://github.com/luismpenholato/queryforge-editor/releases).

1. Open your editor.
2. Go to **Extensions**.
3. Open the actions menu (`...`).
4. Select **Install from VSIX...**
5. Choose the downloaded file.

```bash
code --install-extension queryforge-editor-<version>.vsix
cursor --install-extension queryforge-editor-<version>.vsix
antigravity --install-extension queryforge-editor-<version>.vsix
```

## Try it in 30 seconds

1. Open the Command Palette (`Ctrl+Shift+P`).
2. Run `QueryForge: Open Example`.
3. Click **Analyze Example** (or run `QueryForge: Analyze Current File`).
4. Open **Problems** (`Ctrl+Shift+M`) and hover an underlined finding.
5. Use the lightbulb on a diagnostic marked as a safe fix.
6. For Dapper-heavy files, set `queryforge.analysis.provider` to `dapper` so Core codes such as `DAPPER_SELECT_STAR`, `DAPPER_QUERY_IN_LOOP` and `DAPPER_STRING_CONCAT_SQL` receive the intended context.

What you should see:

- underlines in the editor for matched query smells;
- entries in the Problems Panel with rule codes such as `COUNT_GREATER_THAN_ZERO` (and Dapper codes when the provider is `dapper`);
- hover text with explanation, suggestion, rewrite plan and confidence;
- a Quick Fix only when `fix.safety === "safe"`.

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
- Analyze every open C# document in one pass
- Built-in fictional C# example for quick evaluation
- Native Getting Started walkthrough
- Diagnostics in the editor and Problems Panel
- Detailed hover guidance with explanation, suggestion and rewrite plan
- Safe Quick Fix actions for fixes marked as `safe`
- Optional analyze-on-save for saved C# files
- Output Channel with concise analysis summaries
- Status bar shortcut with per-document analysis state

## Commands

| Command                                 | Description                               |
| --------------------------------------- | ----------------------------------------- |
| `QueryForge: Analyze Current File`      | Analyze the active C# document            |
| `QueryForge: Analyze Current Selection` | Analyze the selected C# text              |
| `QueryForge: Analyze Open Documents`    | Analyze every open C# document            |
| `QueryForge: Open Example`              | Open a built-in fictional C# example      |
| `QueryForge: Open Settings`             | Open QueryForge extension settings        |
| `QueryForge: Clear Diagnostics`         | Clear QueryForge diagnostics and metadata |
| `QueryForge: Show Output`               | Open the QueryForge output channel        |
| `QueryForge: Support the Project`       | Open GitHub Sponsors (optional)           |

## Current capabilities

| Capability               | Available                 |
| ------------------------ | ------------------------- |
| Analyze current C# file  | Yes                       |
| Analyze selected code    | Yes                       |
| Analyze open C# docs     | Yes                       |
| Editor diagnostics       | Yes                       |
| Problems Panel           | Yes                       |
| Detailed hover guidance  | Yes                       |
| Safe Quick Fixes         | When provided by the Core |
| Analyze on save          | Optional                  |
| Full workspace crawl     | Not yet                   |
| Roslyn semantic analysis | No                        |
| Database connection      | No                        |
| SQL execution            | No                        |

## QueryForge ecosystem

| Piece | Role | Package / ID |
| ----- | ---- | ------------ |
| **QueryForge MCP / Core** | Analysis engine + MCP server + TypeScript API | `@luispenholato/queryforge-mcp` |
| **QueryForge Editor** | VS Code / Cursor / Antigravity extension | `queryforge-tools.queryforge-editor` |

The Editor embeds the Core library locally. It does not start the MCP server.

### Version compatibility

| Editor | Core dependency |
| ------ | --------------- |
| `0.1.4` | `@luispenholato/queryforge-mcp@^0.8.1` |
| `0.1.3` | `@luispenholato/queryforge-mcp@^0.8.0` |
| `0.1.2` | `@luispenholato/queryforge-mcp@^0.7.1` |
| `0.1.1` | `@luispenholato/queryforge-mcp@^0.7.0` |

Keep the Editor and Core on matching minor lines when building from source.

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
- Dapper safety smells (`SELECT *`, query-in-loop, string-concat SQL) from Core 0.8.x
- aggregation after materialization (`Count`/`Sum`/`Average`/`GroupBy` after `ToList`) from Core 0.8.x

Set `queryforge.analysis.provider` to `dapper` when reviewing Dapper-heavy files so those Core rules receive the intended provider context. No extra Editor UI is required — findings appear as normal diagnostics after Analyze Current File, Selection, or Open Documents.

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

| Setting                                  | Default   | Description                                  |
| ---------------------------------------- | --------- | -------------------------------------------- |
| `queryforge.analysis.provider`           | `ef-core` | Provider context passed to the analyzer      |
| `queryforge.analysis.maxIssues`          | `100`     | Maximum diagnostics per analysis             |
| `queryforge.analysis.runOnSave`          | `false`   | Analyze saved C# files automatically on save |
| `queryforge.diagnostics.minimumSeverity` | `info`    | Minimum severity shown in the editor         |
| `queryforge.output.showOnError`          | `true`    | Open output channel on analysis errors       |

## Privacy

QueryForge analyzes source text locally. The analysis does not upload source code, connect to databases or execute SQL.

The extension does not use telemetry, analytics, AI services or login.

## When not to trust a finding

QueryForge is conservative text analysis. Treat findings as review prompts:

| Situation | Guidance |
| --------- | -------- |
| `MISSING_AS_NO_TRACKING` on write/update paths | Skip if the entity will be mutated or tracked intentionally |
| `FULL_ENTITY_MATERIALIZATION` / broad `ToList` | May be intentional for small in-memory sets or caching |
| `LARGE_TAKE` on exports/admin reports | Often expected; confirm pagination product requirements |
| `N_PLUS_ONE_QUERY_IN_LOOP` heuristics | Confirm the loop really hits the database per iteration |
| `DAPPER_SELECT_STAR` | Confirm whether loading every column is intentional for the mapped type |
| `DAPPER_QUERY_IN_LOOP` | Confirm the loop body really issues a Dapper round-trip each iteration |
| `DAPPER_STRING_CONCAT_SQL` | Confirm whether dynamic SQL is intentional, reviewed and parameterized |
| `AGGREGATION_AFTER_MATERIALIZATION` / `GROUPBY_AFTER_TOLIST` | Confirm whether aggregation/grouping must run in-memory after a bounded load |
| Low confidence hover values | Prefer manual rewrite plan over Quick Fix |
| Review-required fixes | Never auto-apply; validate SQL and tests first |

Do **not** apply a fix when:

- the document changed after analysis (stale fix — re-run analysis);
- the suggestion conflicts with domain rules or intentional tracking;
- you cannot verify the generated SQL or regression tests.

## Limitations

- Heuristic analysis can produce false positives
- No Roslyn semantic analysis
- Does not validate generated SQL or execution plans
- Safe fixes are intentionally limited
- Full solution/workspace crawl is not available yet (open documents only)
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

Extension ID:

`queryforge-tools.queryforge-editor`

## Community

- [Report a bug](https://github.com/luismpenholato/queryforge-editor/issues/new?template=bug_report.yml)
- [Request a feature](https://github.com/luismpenholato/queryforge-editor/issues/new?template=feature_request.yml)
- [Security advisories](https://github.com/luismpenholato/queryforge-editor/security/advisories/new)

## Support the project

QueryForge Editor is free, open source and fully usable without sponsorship.

If the extension helps your daily work, optional support through [GitHub Sponsors](https://github.com/sponsors/luismpenholato) funds continued maintenance:

- analyzer and editor improvements;
- editor compatibility updates;
- documentation;
- issue resolution;
- ongoing open-source maintenance.

## License

Licensed under the [MIT License](LICENSE).
