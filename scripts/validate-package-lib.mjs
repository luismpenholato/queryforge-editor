import AdmZip from 'adm-zip';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const REQUIRED_COMMANDS = [
  'queryforge.analyzeCurrentFile',
  'queryforge.analyzeSelection',
  'queryforge.clearDiagnostics',
  'queryforge.showOutput',
  'queryforge.supportProject',
];

const FORBIDDEN_PREFIXES = [
  'extension/src/',
  'extension/tests/',
  'extension/node_modules/',
  'extension/scripts/',
  'extension/.github/',
  'extension/.vscode/',
  'extension/coverage/',
];

const BUNDLE_MIN_BYTES = 40_000;
const BUNDLE_MARKERS = [
  '@luispenholato/queryforge-mcp',
  'queryforge.analyzeCurrentFile',
];

export function findVsixCandidates(cwd, expectedVersion) {
  return readdirSync(cwd)
    .filter((name) => name.endsWith('.vsix') && name.includes(expectedVersion))
    .map((name) => join(cwd, name));
}

export function resolveVsixPath({ cwd, argPath, expectedVersion }) {
  if (argPath) {
    const resolved = resolve(cwd, argPath);

    if (!existsSync(resolved)) {
      throw new ValidationError(`VSIX not found: ${resolved}`);
    }

    if (extname(resolved).toLowerCase() !== '.vsix') {
      throw new ValidationError('Provided path is not a .vsix file.');
    }

    return resolved;
  }

  const matches = findVsixCandidates(cwd, expectedVersion);

  if (matches.length === 0) {
    throw new ValidationError(
      `Expected exactly one VSIX for version ${expectedVersion}, found 0.`,
    );
  }

  if (matches.length > 1) {
    throw new ValidationError(
      `Expected exactly one VSIX for version ${expectedVersion}, found ${matches.length}.`,
    );
  }

  return matches[0];
}

export function openVsixArchive(vsixPath) {
  try {
    return new AdmZip(vsixPath);
  } catch {
    throw new ValidationError('Unable to open VSIX as a ZIP archive.');
  }
}

export function getEntryNames(zip) {
  return zip.getEntries().map((entry) => entry.entryName);
}

export function readEntryText(zip, entryName) {
  const entry = zip.getEntry(entryName);
  if (!entry) {
    return null;
  }

  return entry.getData().toString('utf8');
}

export function readEntryBuffer(zip, entryName) {
  const entry = zip.getEntry(entryName);
  if (!entry) {
    return null;
  }

  return entry.getData();
}

function hasEntry(entryNames, candidates) {
  return candidates.some((candidate) => entryNames.includes(candidate));
}

function findPackagedPackageJsonEntry(entryNames) {
  return entryNames.find((entry) => entry === 'extension/package.json') ?? null;
}

export function isForbiddenEntry(entryName) {
  if (FORBIDDEN_PREFIXES.some((prefix) => entryName.startsWith(prefix))) {
    return true;
  }

  if (entryName === 'extension/.env') {
    return true;
  }

  if (entryName.startsWith('extension/.env.')) {
    return true;
  }

  if (entryName.startsWith('extension/') && entryName.endsWith('.vsix')) {
    return true;
  }

  return false;
}

export function parsePackagedPackageJson(zip) {
  const raw = readEntryText(zip, 'extension/package.json');
  if (!raw) {
    throw new ValidationError('Missing required VSIX entry: extension/package.json');
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new ValidationError('Packaged package.json is invalid JSON.');
  }
}

export function validatePackagedManifest(packaged, expected) {
  if (packaged.name !== 'queryforge-editor') {
    throw new ValidationError(`Packaged name ${packaged.name} is not queryforge-editor.`);
  }

  if (packaged.version !== expected.version) {
    throw new ValidationError(
      `Packaged version ${packaged.version} does not match expected version ${expected.version}.`,
    );
  }

  if (packaged.publisher !== 'nebula-themes') {
    throw new ValidationError(`Packaged publisher ${packaged.publisher} is not nebula-themes.`);
  }

  if (packaged.main !== './dist/extension.js') {
    throw new ValidationError(`Packaged main ${packaged.main} is invalid.`);
  }

  if (!packaged.displayName) {
    throw new ValidationError('Packaged displayName is missing.');
  }

  if (!packaged.description) {
    throw new ValidationError('Packaged description is missing.');
  }

  if (packaged.pricing !== 'Free') {
    throw new ValidationError(`Packaged pricing ${packaged.pricing} is not Free.`);
  }

  if (packaged.icon !== 'images/icon.png') {
    throw new ValidationError(`Packaged icon ${packaged.icon} is invalid.`);
  }

  const commands = packaged.contributes?.commands?.map((command) => command.command) ?? [];
  for (const commandId of REQUIRED_COMMANDS) {
    if (!commands.includes(commandId)) {
      throw new ValidationError(`Packaged command is missing: ${commandId}`);
    }
  }
}

export function validateRequiredEntries(entryNames) {
  const required = [
    ['extension/dist/extension.js'],
    ['extension/package.json'],
    ['extension/readme.md', 'extension/README.md'],
    ['extension/changelog.md', 'extension/CHANGELOG.md'],
    ['extension/LICENSE.txt', 'extension/LICENSE'],
    ['extension/images/icon.png'],
  ];

  for (const candidates of required) {
    if (!hasEntry(entryNames, candidates)) {
      throw new ValidationError(
        `Missing required VSIX entry: ${candidates[0]}`,
      );
    }
  }
}

export function validateForbiddenEntries(entryNames) {
  for (const entryName of entryNames) {
    if (isForbiddenEntry(entryName)) {
      throw new ValidationError(`Forbidden VSIX entry found: ${entryName}`);
    }
  }
}

export function validateBundleSource(bundleSource) {
  if (!bundleSource) {
    throw new ValidationError('Missing required VSIX entry: extension/dist/extension.js');
  }

  if (bundleSource.length < BUNDLE_MIN_BYTES) {
    throw new ValidationError('Bundled extension.js is unexpectedly small.');
  }

  if (!bundleSource.includes('require("vscode")') && !bundleSource.includes("require('vscode')")) {
    throw new ValidationError('Bundle does not preserve external require("vscode").');
  }

  if (
    /require\(["']@luispenholato\/queryforge-mcp["']\)/.test(bundleSource) ||
    /from ["']@luispenholato\/queryforge-mcp["']/.test(bundleSource)
  ) {
    throw new ValidationError(
      'Bundle still depends on runtime import of @luispenholato/queryforge-mcp.',
    );
  }

  const markerMatches = BUNDLE_MARKERS.filter((marker) => bundleSource.includes(marker)).length;
  if (markerMatches < 2) {
    throw new ValidationError('Bundle does not appear to include QueryForge analysis code.');
  }
}

export function validateVsixArchive({ zip, entryNames, expectedPackage }) {
  validateRequiredEntries(entryNames);
  validateForbiddenEntries(entryNames);

  const packaged = parsePackagedPackageJson(zip);
  validatePackagedManifest(packaged, expectedPackage);

  const bundleBuffer = readEntryBuffer(zip, 'extension/dist/extension.js');
  validateBundleSource(bundleBuffer?.toString('utf8') ?? null);

  return {
    entryCount: entryNames.length,
    packaged,
  };
}

export function loadExpectedPackage(cwd) {
  return JSON.parse(readFileSync(resolve(cwd, 'package.json'), 'utf8'));
}

export function validateVsixFile({ cwd = process.cwd(), argPath, expectedPackage }) {
  const vsixPath = resolveVsixPath({
    cwd,
    argPath,
    expectedVersion: expectedPackage.version,
  });
  const zip = openVsixArchive(vsixPath);
  const entryNames = getEntryNames(zip);
  const result = validateVsixArchive({ zip, entryNames, expectedPackage });

  return {
    vsixPath,
    size: statSync(vsixPath).size,
    fileName: basename(vsixPath),
    entryCount: result.entryCount,
    packaged: result.packaged,
  };
}
