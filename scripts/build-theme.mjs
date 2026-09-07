import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(scriptDir);
const sourcePath = join(rootDir, 'src', 'base-theme.json');
const partsDir = join(rootDir, 'src', 'parts');
const outputPath = join(rootDir, 'themes', 'Endfield.json');

const theme = JSON.parse(await readFile(sourcePath, 'utf8'));
const partNames = (await readdir(partsDir))
    .filter((name) => name.endsWith('.css'))
    .sort((a, b) => a.localeCompare(b, 'en'));

if (partNames.length === 0) {
    throw new Error('No CSS parts found in src/parts.');
}

const parts = [];
for (const name of partNames) {
    let css = (await readFile(join(partsDir, name), 'utf8')).trim();
    // Local reading-paper assets stay editable; the exported theme is self-contained.
    for (const [token, asset, format] of css.matchAll(/url\("asset:([a-z0-9/-]+\.(svg|png))"\)/g)) {
        const bytes = await readFile(join(rootDir, 'src', 'assets', asset));
        const mime = format === 'svg' ? 'image/svg+xml' : 'image/png';
        css = css.replaceAll(token, `url("data:${mime};base64,${bytes.toString('base64')}")`);
    }
    parts.push(`/* ${name} */\n${css}`);
}

theme.custom_css = `${parts.join('\n\n')}\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(theme, null, 4)}\n`, 'utf8');

console.log(`THEME_BUILD_OK ${partNames.length} parts -> ${outputPath}`);
