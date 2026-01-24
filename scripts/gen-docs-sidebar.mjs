import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files = [];
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) files = files.concat(walk(full));
        else if (e.isFile() && e.name.toLowerCase().endsWith('.md')) files.push(full);
    }
    return files;
}

function normalize(p) {
    return p.replace(/\\/g, '/');
}

// Collect root markdown you explicitly care about
const rootDocs = [
    'README.md',
    'outline.md',
    'projects.md',
    'glossary.md'
].filter((p) => fs.existsSync(p));

// Collect all lesson markdown
const lessonRoot = 'lessons';
const lessonDocs = fs.existsSync(lessonRoot) ? walk(lessonRoot) : [];
lessonDocs.sort((a, b) => normalize(a).localeCompare(normalize(b)));

function titleFromPath(p) {
    const base = path.basename(p, '.md');
    // If the file is README.md, use the folder name
    if (base.toLowerCase() === 'readme' || base.toLowerCase() === 'index') {
        return path.basename(path.dirname(p));
    }
    return base;
}

// Build sidebar content. Links are relative to docs/ (hence ../)
let out = '';
out += `- Getting Started\n`;
out += `  - [Home](README.md)\n`;
for (const p of rootDocs) {
    out += `  - [${titleFromPath(p)}](../${normalize(p)})\n`;
}

out += `\n- Lessons\n`;

// Group by top lesson number folder: lessons/100, lessons/102, etc.
const groups = new Map();
for (const p of lessonDocs) {
    const parts = normalize(p).split('/');
    // parts: ['lessons','100','100.4','README.md'] etc.
    const group = parts[1] ?? 'lessons';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(p);
}

const groupKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

for (const g of groupKeys) {
    out += `  - ${g}\n`;
    for (const p of groups.get(g)) {
        const label = normalize(p)
            .replace(/^lessons\//, '')
            .replace(/\.md$/i, '')
            .replace(/\/README$/i, '')
            .replace(/\/index$/i, '');

        out += `    - [${label}](../${normalize(p)})\n`;
    }
}

const repoRoot = new URL('../..', import.meta.url).pathname;
fs.writeFileSync(path.join(repoRoot, 'docs/_sidebar.md'), out, 'utf8');
console.log('Wrote docs/_sidebar.md');
