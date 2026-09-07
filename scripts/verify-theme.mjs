import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(scriptDir);
const themePath = join(rootDir, 'themes', 'Endfield.json');
const raw = await readFile(themePath, 'utf8');
const theme = JSON.parse(raw);
const css = theme.custom_css;

const failures = [];
const requiredKeys = [
    'name',
    'main_text_color',
    'chat_tint_color',
    'border_color',
    'custom_css',
];

for (const key of requiredKeys) {
    if (!(key in theme)) failures.push(`missing theme key: ${key}`);
}

for (const selector of ['#chat', '.mes', '#send_form', '#send_textarea', '#send_but']) {
    if (!css.includes(selector)) failures.push(`missing CSS selector: ${selector}`);
}

if (!css.includes('prefers-reduced-motion: reduce')) {
    failures.push('missing reduced-motion fallback');
}

if (css.includes('--ef-paper-dots')) {
    failures.push('legacy paper dot token remains');
}

if (!css.includes('--ef-paper-grid')) {
    failures.push('missing paper grid token');
}

const paperGridDeclaration = css.match(/--ef-paper-grid:[^;]+;/)?.[0] ?? '';
if (paperGridDeclaration.includes('%3Ccircle')) {
    failures.push('paper texture still contains an SVG circle dot pattern');
}

if (/https?:\/\//i.test(css)) failures.push('custom_css contains a remote URL');
if (/research[\\/]raw/i.test(css)) failures.push('custom_css references raw research assets');
if (css.includes('asset:')) failures.push('custom_css contains an unembedded local asset');

const openBraces = [...css].filter((char) => char === '{').length;
const closeBraces = [...css].filter((char) => char === '}').length;
if (openBraces !== closeBraces) {
    failures.push(`unbalanced CSS braces: ${openBraces} open, ${closeBraces} close`);
}

if (failures.length > 0) {
    console.error(failures.map((failure) => `VERIFY_FAIL ${failure}`).join('\n'));
    process.exitCode = 1;
} else {
    console.log(`THEME_VERIFY_OK ${Buffer.byteLength(raw)} bytes, ${css.length} CSS chars`);
}
