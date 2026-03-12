// ─────────────────────────────────────────────
// Section Injector – Merge generated content into document
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { MrcfDocument, MrcfSection, GenerationResult } from '../types';
import type { MrcfSubsection } from '@mrcf/parser';

/**
 * Injection mode determines how generated content is merged.
 * - 'replace': Replace entire section content.
 * - 'append': Append to existing section content.
 * - 'create': Only inject if section doesn't exist yet.
 */
export type InjectionMode = 'replace' | 'append' | 'create';

/**
 * Injects AI-generated content into a MRCF document.
 * Returns a new document (does not mutate the original).
 *
 * @param document - The original document
 * @param result - The generation result to inject
 * @param mode - How to handle existing content
 */
export function injectSection(
    document: MrcfDocument,
    result: GenerationResult,
    mode: InjectionMode = 'replace'
): MrcfDocument {
    const existingIndex = document.sections.findIndex(
        (s) => s.name.toUpperCase() === result.sectionName.toUpperCase()
    );

    const newSection: MrcfSection = {
        name: result.sectionName,
        isStandard: ['VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS'].includes(result.sectionName.toUpperCase()),
        content: result.content,
        subsections: [],
        tasks: [],
        assets: [],
    };

    // Clone sections array
    const sections = document.sections.map((s) => ({ ...s, subsections: [...s.subsections] }));

    if (existingIndex === -1) {
        // Section doesn't exist — insert in canonical order
        const canonicalOrder = ['VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS'];
        const targetIdx = canonicalOrder.indexOf(result.sectionName.toUpperCase());

        if (targetIdx === -1) {
            // Custom section: append at end
            sections.push(newSection);
        } else {
            // Find the right position
            let insertAt = sections.length;
            for (let i = 0; i < sections.length; i++) {
                const sIdx = canonicalOrder.indexOf(sections[i].name.toUpperCase());
                if (sIdx > targetIdx) {
                    insertAt = i;
                    break;
                }
            }
            sections.splice(insertAt, 0, newSection);
        }
    } else {
        // Section exists
        switch (mode) {
            case 'replace':
                sections[existingIndex] = {
                    ...sections[existingIndex],
                    content: result.content,
                    subsections: [],
                };
                break;

            case 'append':
                sections[existingIndex] = {
                    ...sections[existingIndex],
                    content: sections[existingIndex].content.trim()
                        ? sections[existingIndex].content + '\n\n' + result.content
                        : result.content,
                };
                break;

            case 'create':
                // Do nothing — section already exists
                break;
        }
    }

    return {
        metadata: { ...document.metadata },
        sections,
        assets: [...document.assets],
        sectionIndex: new Map(document.sectionIndex)
    };
}

/**
 * Serializes a MRCF document back to raw text format.
 */
export function serializeDocument(document: MrcfDocument): string {
    const parts: string[] = [];

    // Metadata
    parts.push('---');
    parts.push(`title: ${document.metadata.title}`);
    parts.push(`version: ${document.metadata.version}`);
    parts.push(`created: ${document.metadata.created}`);
    if (document.metadata.author) parts.push(`author: ${document.metadata.author}`);
    if (document.metadata.updated) parts.push(`updated: ${document.metadata.updated}`);
    if (document.metadata.tags && document.metadata.tags.length > 0) {
        parts.push('tags:');
        for (const tag of document.metadata.tags) {
            parts.push(`  - ${tag}`);
        }
    }
    if (document.metadata.status) parts.push(`status: ${document.metadata.status}`);
    parts.push('---');
    parts.push('');

    // Sections
    for (const section of document.sections) {
        parts.push(serializeSection(section, 1));
        parts.push('');
    }

    return parts.join('\n');
}

function serializeSection(section: MrcfSection, level: number): string {
    const parts: string[] = [];
    parts.push('#'.repeat(level) + ' ' + section.name);

    if (section.content.trim()) {
        parts.push('');
        parts.push(section.content.trim());
    }

    for (const sub of section.subsections) {
        parts.push('');
        parts.push(serializeSubsection(sub, level + 1));
    }

    return parts.join('\n');
}

function serializeSubsection(subsection: MrcfSubsection, level: number): string {
    const parts: string[] = [];
    parts.push('#'.repeat(level) + ' ' + subsection.name);

    if (subsection.content.trim()) {
        parts.push('');
        parts.push(subsection.content.trim());
    }

    for (const sub of subsection.subsections) {
        parts.push('');
        parts.push(serializeSubsection(sub, level + 1));
    }

    return parts.join('\n');
}
