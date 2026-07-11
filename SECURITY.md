# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |

## Reporting a vulnerability

Please report security issues privately using [GitHub Security Advisories](https://github.com/luismpenholato/queryforge-editor/security/advisories/new).

Do not open public issues for exploitable vulnerabilities.

## Scope

This policy covers the QueryForge Editor VS Code extension repository, including:

- extension activation and commands
- local analysis integration
- diagnostics and quick fixes
- packaging and release workflows

## Expectations

- QueryForge Editor is local-first and should not upload source code.
- The extension should not execute SQL or connect to databases.
- Safe fixes must remain conservative and user-initiated.

## Response

Maintainers will acknowledge valid reports as soon as possible and coordinate a fix and release when appropriate.
