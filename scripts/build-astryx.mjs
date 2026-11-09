import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
await mkdir(path.join(root, 'assets/ui'), { recursive: true });
const result = await build({ absWorkingDir: root, entryPoints: ['src/astryx-ui.jsx'], outfile: 'assets/ui/astryx.js', bundle: true, minify: true, format: 'iife', target: ['es2022'], jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'linked', metafile: true, logLevel: 'warning' });
const packages = new Set();
for (const input of Object.keys(result.metafile.inputs)) {
  const match = input.replaceAll('\\', '/').match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
  if (match) packages.add(match[1]);
}
const notices = [];
for (const name of [...packages].sort()) {
  const packageRoot = path.join(root, 'node_modules', name);
  let license = '';
  for (const filename of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md']) {
    try { license = await readFile(path.join(packageRoot, filename), 'utf8'); break; } catch (_) {}
  }
  const pkg = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
  notices.push(name + ' ' + pkg.version + '\nLicense: ' + pkg.license + '\n' + license);
}
await writeFile(path.join(root, 'assets/ui/vendor-licenses.txt'), notices.join('\n\n' + '='.repeat(60) + '\n\n'));
for (const extension of ['js', 'css']) {
  const data = await readFile(path.join(root, 'assets/ui/astryx.' + extension));
  console.log('Astryx ' + extension + ': ' + Math.round(data.length / 1024) + ' KiB; gzip ' + Math.round(gzipSync(data).length / 1024) + ' KiB');
}
