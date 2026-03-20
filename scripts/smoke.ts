/**
 * scripts/smoke.ts
 *
 * Full pipeline smoke test for a .mrcf file:
 *   parse → validate → structure check → render HTML →
 *   render slides → generate site → export all formats →
 *   consistency fingerprint (for cross-device verification)
 *
 * Usage:
 *   npm run smoke                          # runs on example.mrcf
 *   npm run smoke -- example-full.mrcf    # runs on any .mrcf
 *   npm run smoke -- path/to/project.mrcf
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { parse, validate } from '../parser/src/index';
import { renderHtml } from '../src/renderer/htmlRenderer';
import { generateSlideDeck, renderSlides } from '../src/renderer/slidesGenerator';
import { generateSite } from '../src/renderer/siteGenerator';
import { normalize } from '../src/renderer/renderCore';
import { exportDocument } from '../src/renderer/exportService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 16);
}

function hr(label: string) {
  console.log(`\n── ${label} ${'─'.repeat(Math.max(0, 54 - label.length))}`);
}

function ok(msg: string) { console.log('  ✓', msg); }
function warn(msg: string) { console.log('  ⚠', msg); }
function fail(msg: string) { console.error('  ✗', msg); }

// ─── Entry point ──────────────────────────────────────────────────────────────

const arg = process.argv[2];
const filePath = arg
  ? path.resolve(process.cwd(), arg)
  : path.join(__dirname, '../example.mrcf');

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const src = fs.readFileSync(filePath, 'utf8');
const fileName = path.basename(filePath, '.mrcf');
const outDir = path.dirname(filePath);

console.log(`\n${'═'.repeat(58)}`);
console.log(`  MRCF SMOKE TEST — ${fileName}.mrcf`);
console.log(`  File: ${filePath}`);
console.log(`  Size: ${src.length.toLocaleString()} bytes, ${src.split('\n').length} lines`);
console.log(`${'═'.repeat(58)}`);

let hasError = false;

// ─── 1. Parse ─────────────────────────────────────────────────────────────────
hr('1. PARSE');
const parseResult = parse(src);
if (!parseResult.ok || !parseResult.document) {
  parseResult.errors.forEach(e => fail(`[${e.type}] ${e.message}`));
  process.exit(1);
}
const doc = parseResult.document;
ok(`Parse OK`);
ok(`title    : "${doc.metadata.title}"`);
ok(`version  : ${doc.metadata.version}`);
ok(`created  : ${doc.metadata.created}`);
if (doc.metadata.author)  ok(`author   : ${doc.metadata.author}`);
if (doc.metadata.status)  ok(`status   : ${doc.metadata.status}`);
if (doc.metadata.tags?.length) ok(`tags     : ${doc.metadata.tags.join(', ')}`);
ok(`sections : ${doc.sections.map(s => s.name).join(', ')}`);

// subsection depth
doc.sections.forEach(s => {
  if (s.subsections.length > 0) {
    ok(`  ${s.name} → ${s.subsections.length} subsections: ${s.subsections.map(ss => ss.name).join(', ')}`);
  }
});

// tasks
const allTasks = doc.sectionIndex.get('TASKS')?.tasks ?? [];
const doneTasks = allTasks.filter(t => t.completed);
ok(`tasks    : ${doneTasks.length}/${allTasks.length} completed`);
if (allTasks.length > 0) {
  doneTasks.forEach(t => ok(`  [x] ${t.description}`));
  allTasks.filter(t => !t.completed).forEach(t => ok(`  [ ] ${t.description}`));
}

// assets
if (doc.assets.length > 0) {
  ok(`assets   : ${doc.assets.map(a => a.path).join(', ')}`);
}

// ─── 2. Validate ──────────────────────────────────────────────────────────────
hr('2. VALIDATE');
const vResult = validate(doc);
if (vResult.valid) {
  ok('All validation rules passed');
} else {
  hasError = true;
}
vResult.issues.forEach(i => {
  const prefix = `[${i.severity.toUpperCase()}] ${i.code}: ${i.message}`;
  if (i.severity === 'error') fail(prefix);
  else warn(prefix);
});
if (vResult.issues.length === 0) ok('No issues.');

// ─── 3. Structure check ───────────────────────────────────────────────────────
hr('3. STRUCTURE CHECK');
const REQUIRED = ['VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS'] as const;
REQUIRED.forEach(name => {
  const s = doc.sectionIndex.get(name);
  if (!s) { fail(`Missing section: ${name}`); hasError = true; }
  else if (s.content.trim().length < 5) warn(`Section ${name} has very little content`);
  else ok(`${name} — ${s.content.split('\n').length} lines`);
});
doc.sections.filter(s => !s.isStandard).forEach(s => {
  ok(`Custom section: ${s.name}`);
});

// ─── 4. Render HTML ───────────────────────────────────────────────────────────
hr('4. RENDER HTML');
const html = renderHtml(doc, { includeTheme: true, includeToc: true, includeFooter: true });
const htmlOut = path.join(outDir, `${fileName}-output.html`);
fs.writeFileSync(htmlOut, html);
ok(`${html.length.toLocaleString()} bytes → ${path.basename(htmlOut)}`);
ok(`SHA-256 fingerprint: ${sha256(html)}  ← must match on every device`);

// verify key content is present
const checks: [string, string][] = [
  ['<title>', 'HTML has <title>'],
  ['<nav', 'HTML has navigation/TOC'],
  ['VISION', 'VISION section rendered'],
  ['TASKS', 'TASKS section rendered'],
];
checks.forEach(([needle, label]) => {
  if (html.includes(needle)) ok(label);
  else { warn(`Missing: ${label}`); }
});

// ─── 5. Render Slides ─────────────────────────────────────────────────────────
hr('5. RENDER SLIDES');
const deck = generateSlideDeck(doc);
const slidesHtml = renderSlides(doc);
const slidesOut = path.join(outDir, `${fileName}-slides.html`);
fs.writeFileSync(slidesOut, slidesHtml);
ok(`${deck.totalSlides} slides → ${path.basename(slidesOut)}`);
ok(`SHA-256 fingerprint: ${sha256(slidesHtml)}`);
deck.slides.forEach(s =>
  ok(`  [${String(s.number).padStart(2)}] [${s.type.padEnd(12)}] ${s.title}`)
);

// ─── 6. Generate Site ─────────────────────────────────────────────────────────
hr('6. GENERATE STATIC SITE');
const site = generateSite(doc);
const siteDir = path.join(outDir, `${fileName}-site`);
fs.mkdirSync(siteDir, { recursive: true });
site.pages.forEach((content, filename) => {
  fs.writeFileSync(path.join(siteDir, filename), content);
});
fs.writeFileSync(path.join(siteDir, 'search-index.json'), site.searchIndex);
ok(`${site.pages.size} pages + search index → ${path.basename(siteDir)}/`);
site.pages.forEach((content, filename) => {
  ok(`  ${filename.padEnd(20)} ${content.length.toLocaleString()} bytes  sha:${sha256(content)}`);
});

// ─── 7. Export all formats ────────────────────────────────────────────────────
hr('7. EXPORT ALL FORMATS');
Promise.all([
  exportDocument(doc, 'html'),
  exportDocument(doc, 'slides'),
  exportDocument(doc, 'site'),
  exportDocument(doc, 'zip'),
  exportDocument(doc, 'pdf'),
]).then(([htmlExp, slidesExp, siteExp, zipExp, pdfExp]) => {

  [
    { name: 'html',   r: htmlExp },
    { name: 'slides', r: slidesExp },
    { name: 'site',   r: siteExp },
    { name: 'zip',    r: zipExp },
    { name: 'pdf',    r: pdfExp },
  ].forEach(({ name, r }) => {
    if (r.ok) {
      ok(`export '${name}' OK — ${r.output.length.toLocaleString()} bytes, ${r.manifest.sectionCount} sections`);
    } else {
      if (r.warnings.length > 0) warn(`export '${name}': ${r.warnings[0]}`);
      else fail(`export '${name}' FAILED`);
    }
  });

  // ─── 8. Consistency fingerprint ──────────────────────────────────────────────
  hr('8. CONSISTENCY FINGERPRINT');
  console.log('  These hashes must be identical on every device / OS / Node version.');
  console.log('  If they differ, the renderer output is not deterministic.\n');
  ok(`Source      sha:${sha256(src)}`);
  ok(`HTML        sha:${sha256(html)}`);
  ok(`Slides      sha:${sha256(slidesHtml)}`);
  ok(`SectionIdx  sha:${sha256(JSON.stringify([...doc.sectionIndex.keys()]))}`);
  ok(`TaskList    sha:${sha256(JSON.stringify(allTasks.map(t => ({ d: t.description, c: t.completed }))))}`);

  // ─── Summary ─────────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(58)}`);
  if (hasError) {
    console.log('  RESULT: FAILED — see errors above');
  } else {
    console.log('  RESULT: ALL CHECKS PASSED ✓');
  }
  console.log('  Outputs written:');
  console.log(`    ${fileName}-output.html`);
  console.log(`    ${fileName}-slides.html`);
  console.log(`    ${fileName}-site/`);
  console.log(`${'═'.repeat(58)}\n`);

  if (hasError) process.exit(1);

}).catch(err => {
  fail(`Export threw: ${err}`);
  process.exit(1);
});
