/**
 * HTML Renderer Tests — Developer 4
 */

import { renderHtml } from '../htmlRenderer';
import type { MrcfDocument, MrcfSection } from '@mrcf/parser';

function makeDoc(overrides?: Partial<MrcfDocument>): MrcfDocument {
    const defaults: MrcfDocument = {
        metadata: {
            title: 'Test Document',
            version: '1.0',
            created: '2026-03-12',
            author: 'Test Author',
            tags: ['test', 'docs'],
            status: 'draft',
        },
        sections: [
            makeSection('VISION', 'Build something **great**.', true),
            makeSection('CONTEXT', 'For developers.', true),
            makeSection('STRUCTURE', 'Modular system.', true),
            makeSection('PLAN', 'Phase 1: Build.', true),
            makeSection('TASKS', '', true, [
                { description: 'implement parser', completed: false },
                { description: 'define spec', completed: true },
            ]),
        ],
        assets: [],
        sectionIndex: new Map(),
    };

    const doc = { ...defaults, ...overrides };
    doc.sectionIndex = new Map(doc.sections.map((s) => [s.name, s]));
    return doc;
}

function makeSection(
    name: string,
    content: string,
    isStandard: boolean,
    tasks: Array<{ description: string; completed: boolean }> = [],
): MrcfSection {
    return {
        name,
        isStandard,
        content,
        subsections: [],
        tasks: tasks.map((t) => ({ ...t })),
        assets: [],
    };
}

describe('renderHtml', () => {
    it('produces a complete HTML document', () => {
        const doc = makeDoc();
        const html = renderHtml(doc);

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html lang="en">');
        expect(html).toContain('</html>');
        expect(html).toContain('<head>');
        expect(html).toContain('</head>');
        expect(html).toContain('<body>');
        expect(html).toContain('</body>');
    });

    it('includes the document title', () => {
        const doc = makeDoc();
        const html = renderHtml(doc);

        expect(html).toContain('<title>Test Document</title>');
        expect(html).toContain('>Test Document<');
    });

    it('includes metadata in the header', () => {
        const doc = makeDoc();
        const html = renderHtml(doc);

        expect(html).toContain('v1.0');
        expect(html).toContain('Test Author');
        expect(html).toContain('2026-03-12');
        expect(html).toContain('draft');
    });

    it('renders tags', () => {
        const doc = makeDoc();
        const html = renderHtml(doc);

        expect(html).toContain('kdoc-tag');
        expect(html).toContain('test');
        expect(html).toContain('docs');
    });

    it('renders all five standard sections', () => {
        const doc = makeDoc();
        const html = renderHtml(doc);

        expect(html).toContain('id="vision"');
        expect(html).toContain('id="context"');
        expect(html).toContain('id="structure"');
        expect(html).toContain('id="plan"');
        expect(html).toContain('id="tasks"');
    });

    it('applies section-specific CSS classes', () => {
        const doc = makeDoc();
        const html = renderHtml(doc);

        expect(html).toContain('kdoc-section-vision');
        expect(html).toContain('kdoc-section-context');
        expect(html).toContain('kdoc-section-structure');
        expect(html).toContain('kdoc-section-plan');
        expect(html).toContain('kdoc-section-tasks');
    });

    it('includes the table of contents', () => {
        const doc = makeDoc();
        const html = renderHtml(doc);

        expect(html).toContain('kdoc-toc');
        expect(html).toContain('href="#vision"');
        expect(html).toContain('href="#tasks"');
    });

    it('renders markdown content to HTML', () => {
        const doc = makeDoc();
        const html = renderHtml(doc);

        expect(html).toContain('<strong>great</strong>');
    });

    it('includes inline CSS when includeTheme is true', () => {
        const doc = makeDoc();
        const html = renderHtml(doc, { includeTheme: true });

        expect(html).toContain('--kdoc-color-vision');
        expect(html).toContain('<style>');
    });

    it('excludes inline CSS when includeTheme is false', () => {
        const doc = makeDoc();
        const html = renderHtml(doc, { includeTheme: false });

        expect(html).not.toContain('<style>');
    });

    it('excludes TOC when includeToc is false', () => {
        const doc = makeDoc();
        const html = renderHtml(doc, { includeToc: false });

        expect(html).not.toContain('<nav class="kdoc-toc"');
    });

    it('includes footer by default', () => {
        const doc = makeDoc();
        const html = renderHtml(doc);

        expect(html).toContain('kdoc-footer');
        expect(html).toContain('Generated from MRCF');
    });

    it('excludes footer when includeFooter is false', () => {
        const doc = makeDoc();
        const html = renderHtml(doc, { includeFooter: false });

        expect(html).not.toContain('<footer');
    });

    it('shows warnings for missing sections', () => {
        const doc = makeDoc({
            sections: [makeSection('VISION', 'Test.', true)],
        });
        doc.sectionIndex = new Map(doc.sections.map((s) => [s.name, s]));
        const html = renderHtml(doc);

        expect(html).toContain('kdoc-warning');
        expect(html).toContain('Missing required section');
    });

    it('renders meta description tag', () => {
        const doc = makeDoc();
        const html = renderHtml(doc);

        expect(html).toContain('<meta name="description"');
    });

    it('renders meta author tag when author present', () => {
        const doc = makeDoc();
        const html = renderHtml(doc);

        expect(html).toContain('<meta name="author" content="Test Author">');
    });

    it('snapshot: full document HTML', () => {
        const doc = makeDoc();
        const html = renderHtml(doc);

        // Snapshot test — will detect any unintended changes
        expect(html).toMatchSnapshot();
    });
});
