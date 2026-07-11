import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  sourcemap: true,
  minify: false,
};

async function build() {
  try {
    if (watch) {
      const context = await esbuild.context(buildOptions);
      await context.watch();
      console.log('[esbuild] Watching for changes...');
      return;
    }

    await esbuild.build(buildOptions);
    console.log('[esbuild] Build completed.');
  } catch (error) {
    console.error('[esbuild] Build failed:', error);
    process.exit(1);
  }
}

build();
