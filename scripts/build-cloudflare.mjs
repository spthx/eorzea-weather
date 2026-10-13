import { cp, mkdir, rm, readdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, '.deploy', 'cloudflare');
if (path.dirname(output) !== path.join(root, '.deploy')) throw new Error('Unexpected output directory');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of ['index.html', 'robots.txt', 'assets', 'css', 'js']) {
  await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
}
async function filesIn(folder) {
  let count = 0;
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) count += await filesIn(file);
    else {
      if ((await stat(file)).size > 25 * 1024 * 1024) throw new Error('Asset exceeds 25 MiB: ' + file);
      count++;
    }
  }
  return count;
}
console.log('Cloudflare static assets: ' + await filesIn(output) + ' files -> ' + output);
