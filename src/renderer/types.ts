/**
 * Renderer Types — Developer 4
 *
 * Format-agnostic intermediate representation for rendering .mrcf documents.
 * Consumes parser types from @mrcf/parser.
 */

// Re-export parser types for convenience
export type {
    MrcfDocument,
    MrcfSection,
    MrcfSubsection,
    MrcfMetadata,
    MrcfTask,
    MrcfAssetReference,
} from '@mrcf/parser';

// ─── Render Node Types ───────────────────────────────────────────────────────

export type RenderNodeType =
    | 'metadata'
    | 'section'
    | 'subsection'
    | 'toc'
    | 'task-list'
    | 'asset'
    | 'error';

export interface RenderNode {
    /** Node type identifier */
    type: RenderNodeType;
    /** Display label (section name, metadata title, etc.) */
    label: string;
    /** Raw content (Markdown text) */
    content: string;
    /** HTML anchor id (e.g. 'vision', 'context') */
    anchor: string;
    /** Whether this is a standard MRCF section */
    isStandard: boolean;
    /** Heading level (1 for sections, 2+ for subsections) */
    level: number;
    /** Child nodes (subsections, tasks, etc.) */
    children: RenderNode[];
    /** Optional metadata attached to the node */
    meta?: Record<string, unknown>;
}

export interface TocEntry {
    /** Display label */
    label: string;
    /** Anchor link */
    anchor: string;
    /** Nesting level (0 = top section) */
    level: number;
    /** Children */
    children: TocEntry[];
}

export interface RenderTree {
    /** Document metadata node */
    metadata: {
        title: string;
        version: string;
        author?: string;
        created: string;
        updated?: string;
        status?: string;
        tags?: string[];
    };
    /** Ordered section nodes */
    sections: RenderNode[];
    /** Generated table of contents */
    toc: TocEntry[];
    /** All asset references across the document */
    assets: Array<{ alt: string; path: string }>;
    /** Any rendering warnings/errors */
    warnings: string[];
}

// ─── Slide Types ─────────────────────────────────────────────────────────────

export type SlideType =
    | 'title'
    | 'intro'
    | 'problem'
    | 'architecture'
    | 'roadmap'
    | 'next-steps'
    | 'content';

export interface Slide {
    /** Slide type determines layout template */
    type: SlideType;
    /** Slide title */
    title: string;
    /** Optional subtitle */
    subtitle?: string;
    /** Slide body content (HTML) */
    bodyHtml: string;
    /** Optional speaker notes */
    speakerNotes?: string;
    /** Slide number (1-based) */
    number: number;
}

export interface SlideDeck {
    /** Document title */
    title: string;
    /** Document author */
    author?: string;
    /** All slides in order */
    slides: Slide[];
    /** Total slide count */
    totalSlides: number;
}

// ─── Export Types ─────────────────────────────────────────────────────────────

export type ExportFormat = 'html' | 'slides' | 'site' | 'zip' | 'pdf';

export interface ExportManifest {
    /** Export format */
    format: ExportFormat;
    /** ISO timestamp of export */
    exportedAt: string;
    /** Source document title */
    title: string;
    /** Source document version */
    version: string;
    /** Number of sections */
    sectionCount: number;
}

export interface ExportResult {
    /** Whether export succeeded */
    ok: boolean;
    /** Output content (HTML string for html/slides, directory path for site) */
    output: string;
    /** Export manifest */
    manifest: ExportManifest;
    /** Warnings encountered during export */
    warnings: string[];
}
