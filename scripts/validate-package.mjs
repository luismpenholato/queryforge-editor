#!/usr/bin/env node

import {
  ValidationError,
  loadExpectedPackage,
  validateVsixFile,
} from './validate-package-lib.mjs';

function main() {
  const argPath = process.argv[2];
  const expectedPackage = loadExpectedPackage(process.cwd());

  try {
    const result = validateVsixFile({
      cwd: process.cwd(),
      argPath,
      expectedPackage,
    });

    console.log(`Validating ${result.fileName} (${result.size} bytes)`);
    console.log(`Entries: ${result.entryCount}`);
    console.log(`Packaged name: ${result.packaged.name}`);
    console.log(`Packaged publisher: ${result.packaged.publisher}`);
    console.log(`Packaged version: ${result.packaged.version}`);
    console.log(`Packaged displayName: ${result.packaged.displayName}`);
    console.log('VSIX validation passed.');
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(error.message);
      process.exit(1);
    }

    console.error('Unable to open VSIX as a ZIP archive.');
    process.exit(1);
  }
}

main();
