import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { afterEach, describe, expect, it } from 'vitest';
import {
  ValidationError,
  findVsixCandidates,
  isForbiddenEntry,
  openVsixArchive,
  resolveVsixPath,
  validateBundleSource,
  validateForbiddenEntries,
  validatePackagedManifest,
  validateRequiredEntries,
  validateVsixArchive,
  validateVsixFile,
} from '../../scripts/validate-package-lib.mjs';

const expectedPackage = {
  name: 'queryforge-editor',
  version: '0.1.0',
  publisher: 'queryforge',
  pricing: 'Free',
  main: './dist/extension.js',
  displayName: 'QueryForge — EF & LINQ Analyzer',
  description:
    'Detect risky LINQ and Entity Framework query patterns locally with editor diagnostics, detailed guidance and safe quick fixes.',
  icon: 'images/icon.png',
  contributes: {
    commands: [
      { command: 'queryforge.analyzeCurrentFile' },
      { command: 'queryforge.analyzeSelection' },
      { command: 'queryforge.clearDiagnostics' },
      { command: 'queryforge.showOutput' },
      { command: 'queryforge.supportProject' },
      { command: 'queryforge.openExample' },
      { command: 'queryforge.openSettings' },
    ],
    walkthroughs: [{ id: 'queryforge.getStarted', steps: [] }],
    configuration: {
      properties: {
        'queryforge.analysis.runOnSave': { type: 'boolean', default: false },
      },
    },
  },
};

function createValidBundle() {
  return [
    'var vscode = require("vscode");',
    'COUNT_GREATER_THAN_ZERO',
    'MISSING_AS_NO_TRACKING',
    'queryforge.analyzeCurrentFile',
    'queryforge.openExample',
    'x'.repeat(45_000),
  ].join('\n');
}

function createValidVsix(dir, overrides = {}) {
  const zip = new AdmZip();
  const packaged = { ...expectedPackage, ...overrides.packageJson };

  zip.addFile('extension/package.json', Buffer.from(JSON.stringify(packaged), 'utf8'));
  zip.addFile('extension/readme.md', Buffer.from('# Readme', 'utf8'));
  zip.addFile('extension/changelog.md', Buffer.from('# Changelog', 'utf8'));
  zip.addFile('extension/LICENSE.txt', Buffer.from('MIT', 'utf8'));
  zip.addFile('extension/images/icon.png', Buffer.from('png', 'utf8'));

  if (overrides.bundle !== null) {
    zip.addFile(
      'extension/dist/extension.js',
      Buffer.from(overrides.bundle ?? createValidBundle(), 'utf8'),
    );
  }

  for (const entry of overrides.extraEntries ?? []) {
    zip.addFile(entry.name, Buffer.from(entry.data ?? 'x', 'utf8'));
  }

  const filePath = join(dir, overrides.fileName ?? 'queryforge-editor-0.1.0.vsix');
  zip.writeZip(filePath);

  if (overrides.omitEntries?.length) {
    const rewritten = new AdmZip(filePath);
    for (const entryName of overrides.omitEntries) {
      rewritten.deleteFile(entryName);
    }
    rewritten.writeZip(filePath);
  }

  return filePath;
}

const tempDirs = [];

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

function makeTempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'queryforge-vsix-'));
  tempDirs.push(dir);
  return dir;
}

describe('validate-package-lib', () => {
  it('validates a valid VSIX archive', () => {
    const dir = makeTempDir();
    const vsixPath = createValidVsix(dir);
    const result = validateVsixFile({ cwd: dir, expectedPackage });

    expect(result.vsixPath).toBe(vsixPath);
    expect(result.packaged.version).toBe('0.1.0');
  });

  it('rejects a file that is not a ZIP archive', () => {
    const dir = makeTempDir();
    const invalidPath = join(dir, 'invalid.vsix');
    writeFileSync(invalidPath, 'not-a-zip', 'utf8');

    expect(() => openVsixArchive(invalidPath)).toThrow(ValidationError);
  });

  it('rejects missing packaged package.json', () => {
    const dir = makeTempDir();
    const vsixPath = createValidVsix(dir, { omitEntries: ['extension/package.json'] });
    const zip = openVsixArchive(vsixPath);

    expect(() =>
      validateVsixArchive({
        zip,
        entryNames: zip.getEntries().map((entry) => entry.entryName),
        expectedPackage,
      }),
    ).toThrow(/extension\/package\.json/);
  });

  it('rejects invalid packaged package.json', () => {
    const dir = makeTempDir();
    const zip = new AdmZip();
    zip.addFile('extension/package.json', Buffer.from('{ invalid', 'utf8'));
    zip.addFile('extension/dist/extension.js', Buffer.from(createValidBundle(), 'utf8'));
    zip.addFile('extension/readme.md', Buffer.from('# Readme', 'utf8'));
    zip.addFile('extension/changelog.md', Buffer.from('# Changelog', 'utf8'));
    zip.addFile('extension/LICENSE.txt', Buffer.from('MIT', 'utf8'));
    zip.addFile('extension/images/icon.png', Buffer.from('png', 'utf8'));
    const vsixPath = join(dir, 'queryforge-editor-0.1.0.vsix');
    zip.writeZip(vsixPath);

    expect(() => validateVsixFile({ cwd: dir, expectedPackage })).toThrow(/invalid JSON/i);
  });

  it('rejects divergent packaged version', () => {
    const dir = makeTempDir();
    createValidVsix(dir, { packageJson: { version: '0.1.1' } });

    expect(() => validateVsixFile({ cwd: dir, expectedPackage })).toThrow(
      /Packaged version 0\.1\.1 does not match expected version 0\.1\.0/,
    );
  });

  it('rejects missing required entry', () => {
    const dir = makeTempDir();
    const vsixPath = createValidVsix(dir, { omitEntries: ['extension/dist/extension.js'] });
    const zip = openVsixArchive(vsixPath);
    const entryNames = zip.getEntries().map((entry) => entry.entryName);

    expect(() => validateRequiredEntries(entryNames)).toThrow(
      /Missing required VSIX entry: extension\/dist\/extension\.js/,
    );
  });

  it('rejects forbidden folders', () => {
    const dir = makeTempDir();
    createValidVsix(dir, { extraEntries: [{ name: 'extension/src/extension.ts' }] });

    expect(() => validateVsixFile({ cwd: dir, expectedPackage })).toThrow(
      /Forbidden VSIX entry found: extension\/src\//,
    );
  });

  it('rejects runtime import of queryforge-mcp', () => {
    const bundle = [
      'var vscode = require("vscode");',
      'require("@luispenholato/queryforge-mcp");',
      'x'.repeat(45_000),
    ].join('\n');

    expect(() => validateBundleSource(bundle)).toThrow(/runtime import/);
  });

  it('rejects bundle without external vscode', () => {
    expect(() =>
      validateBundleSource(
        [
          'COUNT_GREATER_THAN_ZERO',
          'MISSING_AS_NO_TRACKING',
          'queryforge.analyzeCurrentFile',
          'queryforge.openExample',
          'x'.repeat(45_000),
        ].join('\n'),
      ),
    ).toThrow(/require\("vscode"\)/);
  });

  it('rejects bundle without rule markers', () => {
    expect(() =>
      validateBundleSource(
        [
          'var vscode = require("vscode");',
          'queryforge.analyzeCurrentFile',
          'queryforge.openExample',
          'x'.repeat(45_000),
        ].join('\n'),
      ),
    ).toThrow(/rule markers/);
  });

  it('fails when multiple VSIX files are found', () => {
    const dir = makeTempDir();
    createValidVsix(dir);
    createValidVsix(dir, { fileName: 'queryforge-editor-0.1.0-copy.vsix' });

    expect(findVsixCandidates(dir, '0.1.0')).toHaveLength(2);
    expect(() => resolveVsixPath({ cwd: dir, expectedVersion: '0.1.0' })).toThrow(/found 2/);
  });

  it('rejects non-vsix argument extension', () => {
    const dir = makeTempDir();
    const filePath = join(dir, 'package.json');
    writeFileSync(filePath, '{}', 'utf8');

    expect(() =>
      resolveVsixPath({ cwd: dir, argPath: filePath, expectedVersion: '0.1.0' }),
    ).toThrow(/not a \.vsix file/);
  });

  it('validates packaged manifest fields', () => {
    expect(() =>
      validatePackagedManifest({ ...expectedPackage, publisher: 'wrong' }, expectedPackage),
    ).toThrow(/Packaged publisher wrong is not queryforge/);
  });

  it('rejects packaged preview property', () => {
    expect(() =>
      validatePackagedManifest({ ...expectedPackage, preview: true }, expectedPackage),
    ).toThrow(/preview property must not be present/);
  });

  it('allows legitimate files while rejecting env files', () => {
    expect(isForbiddenEntry('extension/.env')).toBe(true);
    expect(isForbiddenEntry('extension/.env.local')).toBe(true);
    expect(isForbiddenEntry('extension/images/icon.png')).toBe(false);
    expect(isForbiddenEntry('extension/readme.md')).toBe(false);

    expect(() =>
      validateForbiddenEntries(['extension/readme.md', 'extension/.env.local']),
    ).toThrow(/Forbidden VSIX entry found: extension\/\.env\.local/);
  });
});
