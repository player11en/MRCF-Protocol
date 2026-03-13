/**
 * scripts/review.ts
 *
 * Simple CLI helper to review AI proposals in a .mrcf file.
 *
 * Usage:
 *   npm run review -- path/to/project.mrcf
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from '../parser/src/index';

function hr(label: string) {
  console.log(`\n── ${label} ${'─'.repeat(Math.max(0, 54 - label.length))}`);
}

const arg = process.argv[2];

if (!arg) {
  console.error('Usage: review <file.mrcf>');
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), arg);

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const src = fs.readFileSync(filePath, 'utf8');
const result = parse(src);

if (!result.ok || !result.document) {
  console.error('Parse failed:');
  result.errors.forEach((e) => console.error(`  [${e.type}] ${e.message}`));
  process.exit(1);
}

const doc = result.document;
hr(`MRCF PROPOSAL REVIEW — ${path.basename(filePath)}`);

let proposalCount = 0;

for (const section of doc.sections) {
  if (!section.proposals || section.proposals.length === 0) continue;
  console.log(`\nSection: ${section.name}`);
  for (const p of section.proposals) {
    proposalCount++;
    console.log(`\n  Proposal ${proposalCount}: ${p.id}`);
    console.log(`    actor     : ${p.actor}`);
    console.log(`    timestamp : ${p.timestamp}`);
    if (p.confidence) console.log(`    confidence: ${p.confidence}`);
    if (p.reason) console.log(`    reason    : ${p.reason}`);
    console.log('    content   :');
    const lines = p.content.split('\n');
    for (const line of lines) {
      console.log(`      ${line}`);
    }
  }
}

if (proposalCount === 0) {
  console.log('\nNo proposals found in this document.');
} else {
  console.log(`\nTotal proposals: ${proposalCount}`);
  console.log('Use your editor or custom tooling to accept/reject them as needed.');
}

