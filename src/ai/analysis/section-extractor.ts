// ─────────────────────────────────────────────
// Section Extractor – Parse raw .mrcf text into sections
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { MrcfSection, MrcfMetadata, MrcfDocument } from '../types';
import { extractSections } from '../response-parser';

/**
 * Extracts YAML-like metadata from the document header.
 * Expects a block delimited by `---`.
 */
export function extractMetadata(rawDocument: string): MrcfMetadata {
    const metaMatch = rawDocument.match(/^---\s*\n([\s\S]*?)\n---/);

    const defaults: MrcfMetadata = {
        title: 'Untitled',
        version: '0.1',
        created: new Date().toISOString().split('T')[0],
    };

    if (!metaMatch) return defaults;

    const metaBlock = metaMatch[1];
    const metadata: Record<string, string | string[]> = {};

    let currentKey = '';

    for (const line of metaBlock.split('\n')) {
        const kvMatch = line.match(/^(\w+):\s*(.*)$/);
        if (kvMatch) {
            currentKey = kvMatch[1];
            const value = kvMatch[2].trim();
            if (value) {
                metadata[currentKey] = value;
            }
            continue;
        }

        // Array item (tags, etc.)
        const arrayMatch = line.match(/^\s+-\s+(.+)$/);
        if (arrayMatch && currentKey) {
            const existing = metadata[currentKey];
            if (Array.isArray(existing)) {
                existing.push(arrayMatch[1].trim());
            } else {
                metadata[currentKey] = [arrayMatch[1].trim()];
            }
        }
    }

    return {
        title: (metadata.title as string) ?? defaults.title,
        version: (metadata.version as string) ?? defaults.version,
        created: (metadata.created as string) ?? defaults.created,
        author: metadata.author as string | undefined,
        updated: metadata.updated as string | undefined,
        tags: Array.isArray(metadata.tags) ? metadata.tags : undefined,
        status: metadata.status as MrcfMetadata['status'],
    };
}

/**
 * Parses a complete raw .mrcf file into a MrcfDocument.
 * Extracts metadata and all sections.
 */
export function parseMrcfDocument(rawDocument: string): MrcfDocument {
    const metadata = extractMetadata(rawDocument);

    // Remove metadata block before parsing sections
    const contentWithoutMeta = rawDocument.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
    const sections = extractSections(contentWithoutMeta);

    return { metadata: metadata, sections: sections, assets: [], sectionIndex: new Map() };
}

/**
 * Checks which standard KDOC sections are present.
 */
export function listPresentSections(
    document: MrcfDocument
): { present: string[]; missing: string[] } {
    const required = ['VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS'];
    const names = document.sections.map((s) => s.name.toUpperCase());

    return {
        present: required.filter((r) => names.includes(r)),
        missing: required.filter((r) => !names.includes(r)),
    };
}
