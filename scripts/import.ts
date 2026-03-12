#!/usr/bin/env ts-node
/**
 * MRCF Import Tool
 *
 * Converts DOCX, PDF, or Markdown files into .mrcf format.
 *
 * Usage:
 *   npx ts-node scripts/import.ts input.docx [output.mrcf]
 *   npx ts-node scripts/import.ts input.pdf  [output.mrcf]
 *   npx ts-node scripts/import.ts input.md   [output.mrcf]
 *
 * If output path is omitted, prints to stdout.
 *
 * DOCX: Uses mammoth to extract Markdown with heading hierarchy preserved.
 * PDF:  Uses pdf-parse to extract raw text; structure is best-effort.
 * MD:   Wraps existing Markdown in MRCF front-matter and section headers.
 */

import * as fs from 'fs';
import * as path from 'path';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ImportResult {
    mrcf: string;
    warnings: string[];
    title: string;
    author?: string;
    date?: string;
}

// ─── Entry point ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
    const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
    const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
    const verbose = flags.includes('--verbose');

    if (args.length === 0) {
        console.error(
            'Usage: npx ts-node scripts/import.ts <input.[docx|pdf|md]> [output.mrcf] [--verbose]',
        );
        process.exit(1);
    }

    const inputPath = path.resolve(args[0]);
    const outputPath = args[1] ? path.resolve(args[1]) : null;

    if (!fs.existsSync(inputPath)) {
        console.error(`Error: File not found: ${inputPath}`);
        process.exit(1);
    }

    const ext = path.extname(inputPath).toLowerCase();
    let result: ImportResult;

    switch (ext) {
        case '.docx':
            result = await importDocx(inputPath);
            break;
        case '.pdf':
            result = await importPdf(inputPath);
            break;
        case '.md':
        case '.markdown':
            result = await importMarkdown(inputPath);
            break;
        default:
            console.error(`Error: Unsupported file type "${ext}". Supported: .docx, .pdf, .md`);
            process.exit(1);
    }

    if (result.warnings.length > 0 || verbose) {
        for (const w of result.warnings) {
            console.warn(`⚠  ${w}`);
        }
    }

    if (outputPath) {
        fs.writeFileSync(outputPath, result.mrcf, 'utf-8');
        console.log(`✓ Saved to ${outputPath}`);
        console.log(`  Title:  ${result.title}`);
        if (result.author) console.log(`  Author: ${result.author}`);
        console.log(`  Lines:  ${result.mrcf.split('\n').length}`);
    } else {
        process.stdout.write(result.mrcf);
    }
}

// ─── DOCX importer ───────────────────────────────────────────────────────────

async function importDocx(filePath: string): Promise<ImportResult> {
    // mammoth types don't expose convertToMarkdown but it exists at runtime
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const mammoth = require('mammoth') as any;
    const warnings: string[] = [];

    // Extract Markdown via mammoth's built-in Markdown style map
    const { value: md, messages } = await mammoth.convertToMarkdown({ path: filePath }) as {
        value: string;
        messages: Array<{ type: string; message: string }>;
    };

    for (const msg of messages) {
        if (msg.type === 'warning') warnings.push(msg.message);
    }

    // Extract document properties (title, author) via raw XML
    const docxProps = await extractDocxProperties(filePath);

    const title = docxProps.title || path.basename(filePath, '.docx');
    const author = docxProps.author;
    const date = docxProps.date || new Date().toISOString().slice(0, 10);

    const mrcf =buildMrcfFromMarkdown(md, title, author, date, warnings);
    return { mrcf, warnings, title, author, date };
}

/**
 * Extract core properties (title, author, date) from DOCX core.xml.
 * DOCX is a ZIP — we read app.xml and core.xml directly.
 */
async function extractDocxProperties(
    filePath: string,
): Promise<{ title?: string; author?: string; date?: string }> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const JSZip = require('jszip') as typeof import('jszip');
        const data = fs.readFileSync(filePath);
        const zip = await JSZip.loadAsync(data);
        const coreXml = await zip.file('docProps/core.xml')?.async('text');
        if (!coreXml) return {};

        const title = coreXml.match(/<dc:title>([^<]*)<\/dc:title>/)?.[1]?.trim();
        const author =
            coreXml.match(/<dc:creator>([^<]*)<\/dc:creator>/)?.[1]?.trim() ||
            coreXml.match(/<cp:lastModifiedBy>([^<]*)<\/cp:lastModifiedBy>/)?.[1]?.trim();
        const rawDate =
            coreXml.match(/<dcterms:created[^>]*>([^<]*)<\/dcterms:created>/)?.[1]?.trim();
        const date = rawDate ? rawDate.slice(0, 10) : undefined;

        return { title, author, date };
    } catch {
        return {};
    }
}

// ─── PDF importer ─────────────────────────────────────────────────────────────

async function importPdf(filePath: string): Promise<ImportResult> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse') as (
        buffer: Buffer,
        options?: Record<string, unknown>,
    ) => Promise<{ text: string; info: Record<string, string>; numpages: number }>;

    const warnings: string[] = [
        'PDF import is best-effort: heading structure may not be fully detected.',
        'Review the output and restructure sections as needed.',
    ];

    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);

    const title = data.info?.Title || path.basename(filePath, '.pdf');
    const author = data.info?.Author || undefined;
    const date = new Date().toISOString().slice(0, 10);

    warnings.push(`Extracted ${data.numpages} page(s).`);

    const mrcf =buildMrcfFromPlainText(data.text, title, author, date);
    return { mrcf, warnings, title, author, date };
}

// ─── Markdown importer ────────────────────────────────────────────────────────

async function importMarkdown(filePath: string): Promise<ImportResult> {
    const warnings: string[] = [];
    const md = fs.readFileSync(filePath, 'utf-8');

    // Extract H1 as title if present
    const h1Match = md.match(/^#\s+(.+)$/m);
    const title = h1Match ? h1Match[1].trim() : path.basename(filePath, path.extname(filePath));
    const date = new Date().toISOString().slice(0, 10);

    // Check if it already looks like a .mrcf (has standard section markers)
    const hasMrcfSections = /^# (VISION|CONTEXT|STRUCTURE|PLAN|TASKS)$/m.test(md);
    if (hasMrcfSections) {
        warnings.push('File already contains MRCF section markers. Adding front-matter only.');
        const mrcf =buildFrontMatter(title, undefined, date) + '\n' + md;
        return { mrcf, warnings, title, date };
    }

    const mrcf =buildMrcfFromMarkdown(md, title, undefined, date, warnings);
    return { mrcf, warnings, title, date };
}

// ─── Core conversion helpers ──────────────────────────────────────────────────

/**
 * Convert extracted Markdown (from DOCX/mammoth) into a structured .mrcf file.
 * Heuristically maps H1/H2 headings to MRCF sections.
 */
function buildMrcfFromMarkdown(
    md: string,
    title: string,
    author: string | undefined,
    date: string,
    warnings: string[],
): string {
    const lines = md.split('\n');
    const sections = splitIntoSections(lines, warnings);
    return assemble(title, author, date, sections);
}

/**
 * Convert plain text (from PDF) into a structured .mrcf file.
 * Groups content into paragraphs and tries to detect heading-like lines.
 */
function buildMrcfFromPlainText(
    text: string,
    title: string,
    author: string | undefined,
    date: string,
): string {
    // Normalize line endings and remove form feeds
    const cleaned = text
        .replace(/\r\n/g, '\n')
        .replace(/\f/g, '\n\n')
        .replace(/[ \t]+$/gm, '')
        .trim();

    // Heuristic: short lines in ALL-CAPS or Title Case at start of paragraph = headings
    const lines = cleaned.split('\n');
    const mdLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line === '') {
            mdLines.push('');
            continue;
        }
        // Looks like a heading: short (<60 chars), ends without period, looks like a title
        const isHeadingLike =
            line.length < 60 &&
            !line.endsWith('.') &&
            !line.endsWith(',') &&
            /^[A-Z]/.test(line) &&
            (lines[i - 1]?.trim() === '' || i === 0) &&
            (lines[i + 1]?.trim() === '' || i === lines.length - 1);

        if (isHeadingLike) {
            mdLines.push(`## ${line}`);
        } else {
            mdLines.push(line);
        }
    }

    const sections = splitIntoSections(mdLines, []);
    return assemble(title, author, date, sections);
}

/**
 * Split Markdown lines into logical sections for .mrcf mapping.
 * Returns a map of section-name → content lines.
 */
function splitIntoSections(
    lines: string[],
    warnings: string[],
): Map<string, string[]> {
    // MRCF standard section names in order
    const MRCF_SECTIONS = ['VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS'];

    // Collect all H1/H2 blocks from the source
    interface Block {
        heading: string;
        level: number;
        lines: string[];
    }

    const blocks: Block[] = [];
    let current: Block | null = null;

    for (const line of lines) {
        const h1 = line.match(/^# (.+)$/);
        const h2 = line.match(/^## (.+)$/);

        if (h1) {
            if (current) blocks.push(current);
            current = { heading: h1[1].trim(), level: 1, lines: [] };
        } else if (h2) {
            if (current) blocks.push(current);
            current = { heading: h2[1].trim(), level: 2, lines: [] };
        } else {
            if (current) {
                current.lines.push(line);
            } else {
                // Content before any heading — put in an intro block
                current = { heading: '__intro__', level: 0, lines: [line] };
            }
        }
    }
    if (current) blocks.push(current);

    // Heuristic mapping: try to match blocks to MRCF sections by keyword
    const SECTION_KEYWORDS: Record<string, string[]> = {
        VISION: ['vision', 'overview', 'about', 'introduction', 'summary', 'goal', 'purpose'],
        CONTEXT: ['context', 'background', 'audience', 'requirements', 'scope', 'constraints'],
        STRUCTURE: [
            'structure',
            'architecture',
            'design',
            'components',
            'system',
            'technical',
            'implementation',
        ],
        PLAN: ['plan', 'roadmap', 'timeline', 'phases', 'milestones', 'schedule', 'sprint'],
        TASKS: ['tasks', 'todo', 'action', 'backlog', 'issues', 'work items', 'checklist'],
    };

    function matchSection(heading: string): string | null {
        const lower = heading.toLowerCase();
        for (const [section, keywords] of Object.entries(SECTION_KEYWORDS)) {
            if (keywords.some(kw => lower.includes(kw))) return section;
        }
        return null;
    }

    // Build result: MRCF section name → body lines
    const result = new Map<string, string[]>(MRCF_SECTIONS.map(s => [s, []]));
    const unmapped: Block[] = [];

    for (const block of blocks) {
        if (block.heading === '__intro__') {
            result.get('VISION')!.push(...block.lines);
            continue;
        }
        // Skip pure title H1s (level 1, no body) — already used as document title
        if (block.level === 1 && block.lines.every(l => l.trim() === '')) {
            continue;
        }
        const mapped = matchSection(block.heading);
        if (mapped) {
            const target = result.get(mapped)!;
            if (target.length > 0) target.push('');
            if (block.level === 2) target.push(`## ${block.heading}`);
            target.push(...block.lines);
        } else {
            unmapped.push(block);
        }
    }

    // Unmapped blocks go into STRUCTURE (or a new custom section appended at the end)
    if (unmapped.length > 0) {
        const structLines = result.get('STRUCTURE')!;
        for (const block of unmapped) {
            structLines.push('');
            structLines.push(`## ${block.heading}`);
            structLines.push(...block.lines);
        }
        if (unmapped.length > 0) {
            warnings.push(
                `${unmapped.length} section(s) could not be mapped to MRCF standard sections and were placed in STRUCTURE: ` +
                    unmapped.map(b => `"${b.heading}"`).join(', '),
            );
        }
    }

    return result;
}

/**
 * Assemble sections into a complete .mrcf string.
 */
function assemble(
    title: string,
    author: string | undefined,
    date: string,
    sections: Map<string, string[]>,
): string {
    const parts: string[] = [];

    parts.push(buildFrontMatter(title, author, date));

    for (const [name, lines] of sections) {
        const body = lines.join('\n').trim();
        parts.push(`\n# ${name}\n`);
        if (body) {
            parts.push(body);
        } else {
            parts.push(`<!-- TODO: add ${name.toLowerCase()} content -->`);
        }
    }

    return parts.join('\n') + '\n';
}

/**
 * Build YAML front-matter block.
 */
function buildFrontMatter(title: string, author: string | undefined, date: string): string {
    const lines = [
        '---',
        `title: ${yamlString(title)}`,
        `version: 1.0`,
        `created: ${date}`,
    ];
    if (author) lines.push(`author: ${yamlString(author)}`);
    lines.push(`status: draft`);
    lines.push('---');
    return lines.join('\n');
}

function yamlString(value: string): string {
    // Quote if value contains YAML-special characters
    return /[:#\[\]{},|>&*!'"@`]/.test(value) ? `"${value.replace(/"/g, '\\"')}"` : value;
}

// ─── Run ─────────────────────────────────────────────────────────────────────

main().catch(err => {
    console.error('Import failed:', err instanceof Error ? err.message : String(err));
    process.exit(1);
});
