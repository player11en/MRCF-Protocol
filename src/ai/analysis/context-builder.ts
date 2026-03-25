// ─────────────────────────────────────────────
// Context Builder – Assemble MRCF sections for LLM context
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { MrcfDocument, MrcfSection } from '../types';
import type { MrcfSubsection } from '@mrcf/parser';

/**
 * Options for building LLM context from an MRCF document.
 */
export interface ContextBuilderOptions {
    /** Which sections to include. Defaults to all. */
    includeSections?: string[];
    /** Maximum approximate character count for the context. */
    maxCharacters?: number;
    /** Whether to include subsection content. Default: true. */
    includeSubsections?: boolean;
}

/**
 * Builds an optimized context string from a MRCF document
 * for use as LLM input.
 *
 * Sections are ordered in the canonical MRCF v2 order:
 * SUMMARY → VISION → CONTEXT → STRUCTURE → PLAN → TASKS → INSIGHTS → DECISIONS → REFERENCES
 */
export function buildContext(
    document: MrcfDocument,
    options?: ContextBuilderOptions
): string {
    const canonicalOrder = [
        'SUMMARY', 'VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS',
        'INSIGHTS', 'DECISIONS', 'REFERENCES',
    ];
    const includeSubsections = options?.includeSubsections ?? true;

    // Sort sections by canonical MRCF order, unknown sections go at the end
    const sorted = [...document.sections].sort((a, b) => {
        const idxA = canonicalOrder.indexOf(a.name.toUpperCase());
        const idxB = canonicalOrder.indexOf(b.name.toUpperCase());
        const orderA = idxA === -1 ? canonicalOrder.length : idxA;
        const orderB = idxB === -1 ? canonicalOrder.length : idxB;
        return orderA - orderB;
    });

    // Filter by included sections
    const filtered = options?.includeSections
        ? sorted.filter((s) =>
            options.includeSections!.some(
                (name) => name.toUpperCase() === s.name.toUpperCase()
            )
        )
        : sorted;

    // Build context string
    const parts: string[] = [];

    for (const section of filtered) {
        parts.push(formatSection(section, 1, includeSubsections));
    }

    let context = parts.join('\n\n');

    // Truncate if over budget
    if (options?.maxCharacters && context.length > options.maxCharacters) {
        context = context.slice(0, options.maxCharacters) + '\n\n[...truncated]';
    }

    return context;
}

/**
 * Formats a single section with its subsections.
 */
function formatSection(
    section: MrcfSection,
    level: number,
    includeSubsections: boolean
): string {
    const header = '#'.repeat(level) + ' ' + section.name;
    const parts = [header];

    if (section.content.trim()) {
        parts.push(section.content.trim());
    }

    if (includeSubsections && section.subsections.length > 0) {
        for (const sub of section.subsections) {
            parts.push(formatSubsection(sub, level + 1, includeSubsections));
        }
    }

    return parts.join('\n\n');
}

/**
 * Formats a single subsection.
 */
function formatSubsection(
    subsection: MrcfSubsection,
    level: number,
    includeSubsections: boolean
): string {
    const header = '#'.repeat(level) + ' ' + subsection.name;
    const parts = [header];

    if (subsection.content.trim()) {
        parts.push(subsection.content.trim());
    }

    if (includeSubsections && subsection.subsections.length > 0) {
        for (const sub of subsection.subsections) {
            parts.push(formatSubsection(sub, level + 1, includeSubsections));
        }
    }

    return parts.join('\n\n');
}

/**
 * Extracts a specific section from a document by name.
 * Returns undefined if not found.
 */
export function getSection(
    document: MrcfDocument,
    sectionName: string
): MrcfSection | undefined {
    return document.sections.find(
        (s) => s.name.toUpperCase() === sectionName.toUpperCase()
    );
}

/**
 * Returns the full text content of a section including subsections.
 */
export function getSectionText(section: MrcfSection): string {
    return formatSection(section, 1, true);
}
