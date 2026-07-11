# Contributing to QueryForge Editor

Thank you for helping improve QueryForge Editor.

By participating in this project, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## Development setup

Requirements:

- Node.js 20+

```bash
git clone https://github.com/luismpenholato/queryforge-editor.git
cd queryforge-editor
npm ci
npm run typecheck
npm test
npm run build
npm run package
npm run validate
```

## Project layout

```text
src/
  application/     # analysis orchestration
  commands/        # VS Code commands
  configuration/   # settings reader
  diagnostics/     # mapping and metadata
  code-actions/    # safe quick fixes
  hovers/          # diagnostic hover details
  presentation/    # output channel and status bar
tests/             # unit tests for pure logic
scripts/           # packaging and release validation
```

## Issues

Before opening an issue:

- Search existing issues.
- Use minimal fictional C# examples.
- Do not include proprietary code, credentials, connection strings or customer data.
- Use [GitHub Security Advisories](https://github.com/luismpenholato/queryforge-editor/security/advisories/new) for security vulnerabilities.

## Pull requests

- Keep changes focused.
- Add or update tests when behavior changes.
- Run `npm run validate`.
- Update documentation and changelog when applicable.

## Code style

- TypeScript strict mode with `NodeNext` module resolution
- Use `.js` extensions in relative imports
- Keep VS Code integration thin and test pure logic directly
- Do not add telemetry, remote calls or automatic file mutation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
