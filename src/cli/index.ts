#!/usr/bin/env node
/**
 * MRCF CLI — Command-line interface for the MRCF Protocol
 *
 * Commands:
 *   mrcf validate <file>   Parse and validate an .mrcf file, print all issues
 *   mrcf render <file>     Render an .mrcf file to HTML (stdout or --out <dir>)
 *   mrcf smoke <file>      Full end-to-end smoke test (parse → validate → render → export)
 *   mrcf review <file>     List AI proposals in a writeback document and accept/reject
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { parse, validate } from '@mrcf/parser';
import { renderHtml, exportDocument } from '../renderer/index';

const program = new Command();

program
    .name('mrcf')
    .description('AI-native structured document format (.mrcf) — CLI tools')
    .version('0.2.0-beta.1');

// ── validate ──────────────────────────────────────────────────────────────────

program
    .command('validate <file>')
    .description('Parse and validate an .mrcf file, print all issues')
    .option('--json', 'Output results as JSON')
    .action((file: string, opts: { json?: boolean }) => {
        const filePath = resolveFile(file);
        const source = readFile(filePath);

        const parseResult = parse(source);
        if (!parseResult.ok) {
            console.error('❌  Parse failed:');
            for (const err of parseResult.errors) {
                console.error(`   ${err.type}: ${err.message}${err.line ? ` (line ${err.line})` : ''}`);
            }
            process.exit(1);
        }

        const doc = parseResult.document!;
        const validation = validate(doc);

        if (opts.json) {
            console.log(JSON.stringify({ ok: parseResult.ok, validation }, null, 2));
            return;
        }

        console.log(`\n📄  ${path.basename(filePath)}`);
        console.log(`    Title:   ${doc.metadata.title}`);
        console.log(`    Version: ${doc.metadata.version}`);
        console.log(`    Sections: ${doc.sections.map(s => s.name).join(', ')}\n`);

        if (validation.issues.length === 0) {
            console.log('✅  Valid — no issues found.');
        } else {
            const errors = validation.issues.filter(i => i.severity === 'error');
            const warnings = validation.issues.filter(i => i.severity === 'warning');
            for (const issue of errors) {
                console.error(`❌  [${issue.code}] ${issue.message}${issue.line ? ` (line ${issue.line})` : ''}`);
            }
            for (const issue of warnings) {
                console.warn(`⚠️   [${issue.code}] ${issue.message}${issue.line ? ` (line ${issue.line})` : ''}`);
            }
            if (errors.length > 0) process.exit(1);
        }
    });

// ── render ────────────────────────────────────────────────────────────────────

program
    .command('render <file>')
    .description('Render an .mrcf file to HTML')
    .option('--out <dir>', 'Output directory (default: ./mrcf-out)')
    .option('--format <format>', 'Output format: html | slides | site | zip', 'html')
    .action(async (file: string, opts: { out?: string; format?: string }) => {
        const filePath = resolveFile(file);
        const source = readFile(filePath);
        const parseResult = parse(source);

        if (!parseResult.ok) {
            console.error('❌  Parse failed — run `mrcf validate` for details.');
            process.exit(1);
        }

        const doc = parseResult.document!;
        const outDir = opts.out ?? './mrcf-out';
        const format = (opts.format ?? 'html') as 'html' | 'slides' | 'site' | 'zip';

        fs.mkdirSync(outDir, { recursive: true });

        try {
            const result = await exportDocument(doc, format, {
                assetBasePath: path.dirname(filePath),
            });
            if (!result.ok) {
                console.error(`❌  Render failed: ${result.warnings.join(', ')}`);
                process.exit(1);
            }
            const ext = format === 'zip' ? 'zip' : format === 'site' ? 'json' : 'html';
            const outFile = path.join(outDir, `${path.basename(filePath, '.mrcf')}.${ext}`);
            const content = format === 'zip'
                ? Buffer.from(result.output, 'base64')
                : result.output;
            fs.writeFileSync(outFile, content);
            console.log(`✅  Rendered (${format}) → ${outFile}`);
        } catch (err) {
            console.error(`❌  Render failed: ${(err as Error).message}`);
            process.exit(1);
        }
    });

// ── smoke ─────────────────────────────────────────────────────────────────────

program
    .command('smoke <file>')
    .description('Full end-to-end smoke test: parse → validate → render all formats')
    .action(async (file: string) => {
        const filePath = resolveFile(file);
        const source = readFile(filePath);
        const outDir = `./mrcf-smoke-out/${path.basename(filePath, '.mrcf')}`;
        fs.mkdirSync(outDir, { recursive: true });

        console.log(`\n🔬  Smoke test: ${path.basename(filePath)}\n`);

        // Step 1: Parse
        process.stdout.write('  [1/3] Parsing … ');
        const parseResult = parse(source);
        if (!parseResult.ok) {
            console.log('FAIL');
            for (const err of parseResult.errors) console.error(`       ${err.message}`);
            process.exit(1);
        }
        console.log('OK');

        // Step 2: Validate
        process.stdout.write('  [2/3] Validating … ');
        const doc = parseResult.document!;
        const validation = validate(doc);
        const errors = validation.issues.filter(i => i.severity === 'error');
        if (errors.length > 0) {
            console.log('FAIL');
            for (const e of errors) console.error(`       [${e.code}] ${e.message}`);
            process.exit(1);
        }
        const warnings = validation.issues.filter(i => i.severity === 'warning');
        console.log(`OK${warnings.length > 0 ? ` (${warnings.length} warnings)` : ''}`);

        // Step 3: Render all formats
        const formats: Array<'html' | 'slides' | 'site' | 'zip'> = ['html', 'slides', 'site', 'zip'];
        for (const fmt of formats) {
            process.stdout.write(`  [3/3] Rendering ${fmt} … `);
            try {
                const result = await exportDocument(doc, fmt, {
                    assetBasePath: path.dirname(filePath),
                });
                if (!result.ok) {
                    console.log(`WARN (${result.warnings.join(', ')})`);
                } else {
                    const ext = fmt === 'zip' ? 'zip' : fmt === 'site' ? 'json' : 'html';
                    const outFile = path.join(outDir, `${path.basename(filePath, '.mrcf')}.${ext}`);
                    const content = fmt === 'zip' ? Buffer.from(result.output, 'base64') : result.output;
                    fs.writeFileSync(outFile, content);
                    console.log('OK');
                }
            } catch (err) {
                console.log('FAIL');
                console.error(`       ${(err as Error).message}`);
                process.exit(1);
            }
        }

        console.log(`\n✅  All checks passed → ${path.resolve(outDir)}\n`);
    });

// ── review ────────────────────────────────────────────────────────────────────

program
    .command('review <file>')
    .description('List AI proposals in a writeback document')
    .option('--accept-all', 'Accept all proposals without prompting')
    .option('--reject-all', 'Reject all proposals without prompting')
    .action(async (file: string, opts: { acceptAll?: boolean; rejectAll?: boolean }) => {
        const filePath = resolveFile(file);
        let source = readFile(filePath);

        const parseResult = parse(source);
        if (!parseResult.ok) {
            console.error('❌  Parse failed — run `mrcf validate` for details.');
            process.exit(1);
        }

        const doc = parseResult.document!;
        const allProposals = doc.sections.flatMap(s => (s.proposals ?? []).map(p => ({ ...p, sectionName: s.name })));

        if (allProposals.length === 0) {
            console.log('✅  No pending proposals found.');
            return;
        }

        console.log(`\n📋  ${allProposals.length} proposal(s) found:\n`);

        for (const proposal of allProposals) {
            console.log(`─── [${proposal.sectionName}] from ${proposal.actor} at ${proposal.timestamp}`);
            if (proposal.confidence) console.log(`    Confidence: ${proposal.confidence}`);
            if (proposal.reason) console.log(`    Reason: ${proposal.reason}`);
            console.log(`    Content preview: ${proposal.content.slice(0, 120).trim()}…\n`);

            if (opts.acceptAll) {
                source = acceptProposal(source, proposal.content);
                appendHistory(filePath, `${today()} | human | accepted proposal from ${proposal.actor} in ${proposal.sectionName}`);
                console.log('    → Accepted\n');
            } else if (opts.rejectAll) {
                source = rejectProposal(source, proposal.content);
                appendHistory(filePath, `${today()} | human | rejected proposal from ${proposal.actor} in ${proposal.sectionName}`);
                console.log('    → Rejected\n');
            } else {
                console.log('    Use --accept-all or --reject-all to process proposals in bulk.');
            }
        }

        if (opts.acceptAll || opts.rejectAll) {
            fs.writeFileSync(filePath, source, 'utf-8');
            console.log(`✅  Saved: ${filePath}`);
        }
    });

// ── helpers ───────────────────────────────────────────────────────────────────

function resolveFile(file: string): string {
    const filePath = path.resolve(file);
    if (!fs.existsSync(filePath)) {
        console.error(`❌  File not found: ${filePath}`);
        process.exit(1);
    }
    return filePath;
}

function readFile(filePath: string): string {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        console.error(`❌  Cannot read file: ${(err as Error).message}`);
        process.exit(1);
    }
}

function acceptProposal(source: string, content: string): string {
    // Replace the full <!-- proposal: ... --> block with just the content
    return source.replace(
        /<!--\s*proposal:[^\n]*\n[\s\S]*?-->/,
        content.trim(),
    );
}

function rejectProposal(source: string, _content: string): string {
    // Remove the full <!-- proposal: ... --> block
    return source.replace(/<!--\s*proposal:[^\n]*\n[\s\S]*?-->/, '');
}

function appendHistory(filePath: string, entry: string): void {
    let source = fs.readFileSync(filePath, 'utf-8');
    if (source.includes('# HISTORY')) {
        source = source.replace('# HISTORY\n', `# HISTORY\n${entry}\n`);
    } else {
        source += `\n# HISTORY\n${entry}\n`;
    }
    fs.writeFileSync(filePath, source, 'utf-8');
}

function today(): string {
    return new Date().toISOString().split('T')[0];
}

program.parse(process.argv);
