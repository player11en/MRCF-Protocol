/**
 * Render Core — Developer 4
 *
 * Normalizes a parsed MrcfDocument into a format-agnostic RenderTree.
 * This is the shared foundation consumed by all output renderers
 * (HTML, Slides, Site, Export).
 */

import type {
    MrcfDocument,
    MrcfSection,
    MrcfSubsection,
} from '@mrcf/parser';
import type { RenderNode, RenderTree, TocEntry } from './types';

/** All standard section names defined by the MRCF v2 spec */
const STANDARD_SECTIONS = [
    'SUMMARY', 'VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS',
    'INSIGHTS', 'DECISIONS', 'REFERENCES',
];

/** Required sections that must be present in every v2 document */
const REQUIRED_SECTIONS = ['VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS'];

/**
 * Convert a section name to a URL-safe anchor id.
 * e.g. "VISION" → "vision", "System Architecture" → "system-architecture"
 */
export function toAnchor(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Normalize a MrcfDocument into a RenderTree.
 * This is the main entry point for the render pipeline.
 */
export function normalize(doc: MrcfDocument): RenderTree {
    const warnings: string[] = [];

    // Only warn about missing required sections (optional v2 sections are allowed to be absent)
    const presentSections = new Set(doc.sections.map((s) => s.name));
    for (const req of REQUIRED_SECTIONS) {
        if (!presentSections.has(req)) {
            warnings.push(`Missing required section: ${req}`);
        }
    }

    // Convert sections to render nodes
    const sections: RenderNode[] = doc.sections.map((section) =>
        sectionToNode(section, 1),
    );

    // Build table of contents
    const toc = buildToc(doc.sections);

    // Collect all assets
    const assets = doc.assets.map((a) => ({ alt: a.alt, path: a.path }));

    return {
        metadata: {
            title: doc.metadata.title,
            version: doc.metadata.version,
            author: doc.metadata.author,
            created: doc.metadata.created,
            updated: doc.metadata.updated,
            status: doc.metadata.status,
            tags: doc.metadata.tags,
        },
        sections,
        toc,
        assets,
        warnings,
    };
}

/**
 * Convert a MrcfSection into a RenderNode (recursive for subsections).
 */
function sectionToNode(section: MrcfSection, level: number): RenderNode {
    const children: RenderNode[] = section.subsections.map((sub) =>
        subsectionToNode(sub),
    );

    return {
        type: 'section',
        label: section.name,
        content: section.content,
        anchor: toAnchor(section.name),
        isStandard: section.isStandard,
        level,
        children,
        meta: {
            taskCount: section.tasks.length,
            completedTasks: section.tasks.filter((t) => t.completed).length,
            assetCount: section.assets.length,
            // v2 structured block data passed through for specialized renderers
            v2: {
                summary: section.summary,
                insights: section.insights,
                decisions: section.decisions,
                references: section.references,
            },
        },
    };
}

/**
 * Convert a MrcfSubsection into a RenderNode (recursive).
 */
function subsectionToNode(sub: MrcfSubsection): RenderNode {
    const children: RenderNode[] = sub.subsections.map((child) =>
        subsectionToNode(child),
    );

    return {
        type: 'subsection',
        label: sub.name,
        content: sub.content,
        anchor: toAnchor(sub.name),
        isStandard: false,
        level: sub.level,
        children,
    };
}

/**
 * Build a hierarchical table of contents from sections.
 */
function buildToc(sections: MrcfSection[]): TocEntry[] {
    return sections.map((section) => ({
        label: section.name,
        anchor: toAnchor(section.name),
        level: 0,
        children: section.subsections.map((sub) => buildTocEntry(sub, 1)),
    }));
}

/**
 * Recursively build a TOC entry from a subsection.
 */
function buildTocEntry(sub: MrcfSubsection, level: number): TocEntry {
    return {
        label: sub.name,
        anchor: toAnchor(sub.name),
        level,
        children: sub.subsections.map((child) => buildTocEntry(child, level + 1)),
    };
}
