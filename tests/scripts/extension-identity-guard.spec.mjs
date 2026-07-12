import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(process.cwd());
const FORBIDDEN_PATTERNS = ['nebula-themes.queryforge-editor', 'nebula-themes'];
const SCAN_DIRECTORIES = ['src', 'scripts', 'tests', '.github'];
const SCAN_FILES = [
  'package.json',
  'README.md',
  'CHANGELOG.md',
  'package-lock.json',
];

function shouldScanFile(filePath) {
  return /\.(ts|mjs|js|json|md|yml|yaml)$/.test(filePath);
}

function collectFiles(directory) {
  const files = [];

  for (const entry of readdirSync(directory)) {
    const fullPath = join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (entry === 'node_modules' || entry === 'dist' || entry === '.git') {
        continue;
      }

      files.push(...collectFiles(fullPath));
      continue;
    }

    if (shouldScanFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function findForbiddenReferences() {
  const matches = [];
  const guardSpecPath = join(ROOT, 'tests', 'scripts', 'extension-identity-guard.spec.mjs');

  for (const directory of SCAN_DIRECTORIES) {
    const fullDirectory = join(ROOT, directory);
    for (const filePath of collectFiles(fullDirectory)) {
      if (filePath === guardSpecPath) {
        continue;
      }

      const content = readFileSync(filePath, 'utf8');
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (content.includes(pattern)) {
          matches.push({ filePath, pattern });
        }
      }
    }
  }

  for (const relativePath of SCAN_FILES) {
    const filePath = join(ROOT, relativePath);
    const content = readFileSync(filePath, 'utf8');
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (content.includes(pattern)) {
        matches.push({ filePath, pattern });
      }
    }
  }

  return matches;
}

describe('extension identity guard', () => {
  it('does not keep production references to the old publisher identity', () => {
    const matches = findForbiddenReferences();

    expect(matches).toEqual([]);
  });
});
