// Bundles the two entry points that import npm packages (chess.js, via
// gameState.js/features.js) into self-contained IIFEs Chrome can load
// directly as a content script / side-panel script. Everything else
// (manifest.json, background/sw.js) is referenced unbundled.
import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';

const entryPoints = ['src/content/board.js', 'src/panel/panel.js'];

await build({
  entryPoints,
  bundle: true,
  format: 'iife',
  outdir: 'dist',
  outbase: 'src',
  target: 'chrome110',
});

// panel.html references ./panel.js by relative path, so it has to live
// next to the bundled panel.js in dist/panel/, not just src/panel/.
await mkdir('dist/panel', { recursive: true });
await copyFile('src/panel/panel.html', 'dist/panel/panel.html');

console.log(`Built ${entryPoints.join(', ')} -> dist/ (+ panel.html copied)`);
