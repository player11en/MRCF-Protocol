// ─────────────────────────────────────────────
// Section Injector – Merge generated content into document
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { MrcfDocument, MrcfSection, GenerationResult } from '../types';
import type { MrcfSubsection } from '@mrcf/parser';
import type { SectionPermission } from '@mrcf/parser';

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
    // Determine effective permission for this section
    const sectionName = result.sectionName.toUpperCase();
    const meta: any = document.metadata as any;
    const perms: Record<string, SectionPermission> | undefined = meta.sectionPermissions;
    const defaultPerm: SectionPermission | undefined = meta.defaultPermission;
    const effectivePerm: SectionPermission =
        (perms && perms[sectionName]) ||
        defaultPerm ||
        'ai-assisted';

    if (effectivePerm === 'human-only') {
        // Do not modify the document at all
        return {
            metadata: { ...document.metadata },
            sections: [...document.sections],
            assets: [...document.assets],
            sectionIndex: new Map(document.sectionIndex),
        };
    }

    const existingIndex = document.sections.findIndex(
        (s) => s.name.toUpperCase() === sectionName
    );

    const newSection: MrcfSection = {
        name: result.sectionName,
        isStandard: ['VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS'].includes(sectionName),
        content: result.content,
        subsections: [],
        tasks: [],
        assets: [],
    };

    // Clone sections array
    const sections = document.sections.map((s) => ({ ...s, subsections: [...s.subsections], proposals: s.proposals ? [...s.proposals] : undefined }));

    if (existingIndex === -1) {
        // Section doesn't exist — insert in canonical order
        const canonicalOrder = ['VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS'];
        const targetIdx = canonicalOrder.indexOf(sectionName);

        if (targetIdx === -1) {
            // Custom section: append at end
            if (effectivePerm === 'ai-assisted') {
                newSection.content = createProposalBlock(result);
                newSection.proposals = [
                    createProposalMeta(result, newSection.name, 1),
                ];
            }
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
            if (effectivePerm === 'ai-assisted') {
                newSection.content = createProposalBlock(result);
                newSection.proposals = [
                    createProposalMeta(result, newSection.name, 1),
                ];
            }
            sections.splice(insertAt, 0, newSection);
        }
    } else {
        // Section exists
        const existing = sections[existingIndex];
        if (effectivePerm === 'ai-assisted') {
            // Append a proposal block rather than overwriting content
            const nextId = (existing.proposals?.length ?? 0) + 1;
            const proposalText = createProposalBlock(result);
            const sep = existing.content.trim().length > 0 ? '\n\n' : '';
            sections[existingIndex] = {
                ...existing,
                content: existing.content + sep + proposalText,
                proposals: [
                    ...(existing.proposals ?? []),
                    createProposalMeta(result, existing.name, nextId),
                ],
            };
        } else {
            // ai-primary – write directly according to mode
            switch (mode) {
                case 'replace':
                    sections[existingIndex] = {
                        ...existing,
                        content: result.content,
                        subsections: [],
                    };
                    break;

                case 'append':
                    sections[existingIndex] = {
                        ...existing,
                        content: existing.content.trim()
                            ? existing.content + '\n\n' + result.content
                            : result.content,
                    };
                    break;

                case 'create':
                    // Do nothing — section already exists
                    break;
            }
        }
    }

    const updated = {
        metadata: { ...document.metadata },
        sections,
        assets: [...document.assets],
        sectionIndex: new Map<string, MrcfSection>(sections.map((s) => [s.name, s])),
    };

    // Append HISTORY entry when AI touched the document
    return appendHistoryEntry(updated, result, effectivePerm, mode);
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
    if ((document.metadata as any).defaultPermission) {
        parts.push(`defaultPermission: ${(document.metadata as any).defaultPermission}`);
    }
    if ((document.metadata as any).sectionPermissions) {
        const perms = (document.metadata as any).sectionPermissions as Record<string, SectionPermission>;
        parts.push('sections:');
        for (const [name, perm] of Object.entries(perms)) {
            parts.push(`  - ${name}:${perm}`);
        }
    }
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

function createProposalBlock(result: GenerationResult): string {
    const actor = `ai:${result.model}`;
    const timestamp = new Date().toISOString();
    const confidence = 'high';
    const lines: string[] = [];
    lines.push(`<!-- proposal: ${actor} | ${timestamp} | confidence:${confidence}`);
    if (result.content.trim()) {
        lines.push(result.content.trim());
    }
    lines.push(`reason: generated by ${result.model}`);
    lines.push('-->');
    return lines.join('\n');
}

function createProposalMeta(
    result: GenerationResult,
    sectionName: string,
    counter: number,
) {
    const actor = `ai:${result.model}`;
    const timestamp = new Date().toISOString();
    return {
        id: `${sectionName}-${counter}`,
        sectionName,
        actor,
        timestamp,
        confidence: 'high' as const,
        reason: `generated by ${result.model}`,
        content: result.content,
    };
}

function appendHistoryEntry(
    document: MrcfDocument,
    result: GenerationResult,
    perm: SectionPermission,
    mode: InjectionMode,
): MrcfDocument {
    const date = new Date().toISOString().slice(0, 10);
    const actor = `ai:${result.model}`;
    const summary =
        perm === 'ai-assisted'
            ? `proposed ${result.sectionName} (${mode})`
            : `updated ${result.sectionName} (${mode}, ${perm})`;

    let history = document.sections.find((s) => s.name.toUpperCase() === 'HISTORY');
    if (!history) {
        history = {
            name: 'HISTORY',
            isStandard: false,
            content: '',
            subsections: [],
            tasks: [],
            assets: [],
        };
        document.sections.push(history);
        document.sectionIndex.set('HISTORY', history);
    }

    const line = `${date} | ${actor} | ${summary}`;
    history.content = history.content.trim()
        ? `${history.content.trim()}\n${line}`
        : line;

    return {
        metadata: { ...document.metadata },
        sections: [...document.sections],
        assets: [...document.assets],
        sectionIndex: new Map<string, MrcfSection>(document.sections.map((s) => [s.name, s])),
    };
}
