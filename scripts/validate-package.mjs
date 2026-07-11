#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

const root = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const expectedVersion = packageJson.version;
const argPath = process.argv[2];

function findVsixFile() {
  if (argPath) {
    const resolved = resolve(root, argPath);
    if (!existsSync(resolved)) {
      console.error(`VSIX not found: ${resolved}`);
      process.exit(1);
    }
    return resolved;
  }

  const matches = readdirSync(root)
    .filter((name) => name.endsWith('.vsix') && name.includes(expectedVersion))
    .map((name) => join(root, name));

  if (matches.length !== 1) {
    console.error(
      `Expected exactly one VSIX for version ${expectedVersion}, found ${matches.length}.`,
    );
    process.exit(1);
  }

  return matches[0];
}

function listZipEntries(vsixPath) {
  const output = execSync(`tar -tf "${vsixPath}"`, { encoding: 'utf8' });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertIncludes(entries, candidates) {
  const found = candidates.some((candidate) => entries.includes(candidate));
  if (!found) {
    console.error(`Missing required VSIX entry. Expected one of: ${candidates.join(', ')}`);
    process.exit(1);
  }
}

function assertExcludes(entries, forbiddenPrefix) {
  const found = entries.some((entry) => entry.startsWith(forbiddenPrefix));
  if (found) {
    console.error(`Forbidden VSIX entry found: ${forbiddenPrefix}`);
    process.exit(1);
  }
}

const vsixPath = findVsixFile();
const entryNames = listZipEntries(vsixPath);

console.log(`Validating ${basename(vsixPath)} (${statSync(vsixPath).size} bytes)`);
console.log(`Entries: ${entryNames.length}`);

assertIncludes(entryNames, ['extension/dist/extension.js']);
assertIncludes(entryNames, ['extension/package.json']);
assertIncludes(entryNames, ['extension/readme.md', 'extension/README.md']);
assertIncludes(entryNames, ['extension/changelog.md', 'extension/CHANGELOG.md']);
assertIncludes(entryNames, ['extension/LICENSE.txt', 'extension/LICENSE']);
assertIncludes(entryNames, ['extension/images/icon.png']);

const forbidden = [
  'extension/src/',
  'extension/tests/',
  'extension/node_modules/',
  'extension/.env',
  'extension/coverage/',
];

for (const path of forbidden) {
  assertExcludes(entryNames, path);
}

const bundlePath = join(root, 'dist', 'extension.js');
if (!existsSync(bundlePath)) {
  console.error('Local bundle dist/extension.js not found for content validation.');
  process.exit(1);
}

const bundleSource = readFileSync(bundlePath, 'utf8');
if (!bundleSource.includes('require("vscode")') && !bundleSource.includes("require('vscode')")) {
  console.error('Bundle does not preserve external require("vscode").');
  process.exit(1);
}

if (
  /require\(["']@luispenholato\/queryforge-mcp["']\)/.test(bundleSource) ||
  /from ["']@luispenholato\/queryforge-mcp["']/.test(bundleSource)
) {
  console.error('Bundle still depends on runtime import of @luispenholato/queryforge-mcp.');
  process.exit(1);
}

if (!bundleSource.includes('QueryAnalysisService')) {
  console.error('Bundle does not appear to include QueryForge analysis code.');
  process.exit(1);
}

const packagedJsonEntry = entryNames.find((entry) => entry === 'extension/package.json');
if (!packagedJsonEntry) {
  console.error('Packaged package.json not found.');
  process.exit(1);
}

if (packageJson.version !== expectedVersion) {
  console.error(`Packaged version ${packageJson.version} does not match ${expectedVersion}.`);
  process.exit(1);
}

console.log('VSIX validation passed.');
