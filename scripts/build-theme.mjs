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
    const css = (await readFile(join(partsDir, name), 'utf8')).trim();
    parts.push(`/* ${name} */\n${css}`);
}

theme.custom_css = `${parts.join('\n\n')}\n`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(theme, null, 4)}\n`, 'utf8');

console.log(`THEME_BUILD_OK ${partNames.length} parts -> ${outputPath}`);
