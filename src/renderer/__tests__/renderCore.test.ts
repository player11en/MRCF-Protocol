/**
 * Render Core Tests — Developer 4
 */

import { normalize, toAnchor } from '../renderCore';
import type { MrcfDocument, MrcfSection } from '@mrcf/parser';

/** Helper: build a minimal valid MrcfDocument */
function makeDoc(overrides?: Partial<MrcfDocument>): MrcfDocument {
    const defaults: MrcfDocument = {
        metadata: {
            title: 'Test Document',
            version: '1.0',
            created: '2026-03-12',
        },
        sections: [
            makeSection('VISION', 'Build something great.', true),
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

describe('toAnchor', () => {
    it('converts section names to lowercase anchors', () => {
        expect(toAnchor('VISION')).toBe('vision');
        expect(toAnchor('CONTEXT')).toBe('context');
        expect(toAnchor('TASKS')).toBe('tasks');
    });

    it('converts spaces and special chars to hyphens', () => {
        expect(toAnchor('System Architecture')).toBe('system-architecture');
        expect(toAnchor('API Layer (v2)')).toBe('api-layer-v2');
    });

    it('strips leading and trailing hyphens', () => {
        expect(toAnchor('--test--')).toBe('test');
    });
});

describe('normalize', () => {
    it('produces a RenderTree from a valid MrcfDocument', () => {
        const doc = makeDoc();
        const tree = normalize(doc);

        expect(tree.metadata.title).toBe('Test Document');
        expect(tree.metadata.version).toBe('1.0');
        expect(tree.sections).toHaveLength(5);
        expect(tree.toc).toHaveLength(5);
        expect(tree.warnings).toHaveLength(0);
    });

    it('preserves section order', () => {
        const doc = makeDoc();
        const tree = normalize(doc);

        const names = tree.sections.map((s) => s.label);
        expect(names).toEqual(['VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS']);
    });

    it('marks standard sections as isStandard', () => {
        const doc = makeDoc();
        const tree = normalize(doc);

        expect(tree.sections[0].isStandard).toBe(true);
        expect(tree.sections[4].isStandard).toBe(true);
    });

    it('generates anchors for each section', () => {
        const doc = makeDoc();
        const tree = normalize(doc);

        expect(tree.sections[0].anchor).toBe('vision');
        expect(tree.sections[3].anchor).toBe('plan');
    });

    it('warns about missing standard sections', () => {
        const doc = makeDoc({
            sections: [
                makeSection('VISION', 'Test.', true),
                makeSection('CONTEXT', 'Test.', true),
                // Missing STRUCTURE, PLAN, TASKS
            ],
        });
        doc.sectionIndex = new Map(doc.sections.map((s) => [s.name, s]));
        const tree = normalize(doc);

        expect(tree.warnings).toHaveLength(3);
        expect(tree.warnings[0]).toContain('STRUCTURE');
        expect(tree.warnings[1]).toContain('PLAN');
        expect(tree.warnings[2]).toContain('TASKS');
    });

    it('handles custom sections gracefully', () => {
        const doc = makeDoc({
            sections: [
                ...makeDoc().sections,
                makeSection('CUSTOM_SECTION', 'Custom content.', false),
            ],
        });
        doc.sectionIndex = new Map(doc.sections.map((s) => [s.name, s]));
        const tree = normalize(doc);

        expect(tree.sections).toHaveLength(6);
        const custom = tree.sections[5];
        expect(custom.label).toBe('CUSTOM_SECTION');
        expect(custom.isStandard).toBe(false);
    });

    it('tracks task counts in section meta', () => {
        const doc = makeDoc();
        const tree = normalize(doc);

        const tasksNode = tree.sections[4];
        expect(tasksNode.meta?.taskCount).toBe(2);
        expect(tasksNode.meta?.completedTasks).toBe(1);
    });

    it('collects assets from the document', () => {
        const doc = makeDoc();
        doc.assets = [{ alt: 'diagram', path: 'assets/diagram.png' }];
        const tree = normalize(doc);

        expect(tree.assets).toHaveLength(1);
        expect(tree.assets[0].alt).toBe('diagram');
        expect(tree.assets[0].path).toBe('assets/diagram.png');
    });

    it('builds TOC with subsection children', () => {
        const doc = makeDoc();
        doc.sections[2].subsections = [
            {
                name: 'API Layer',
                level: 2,
                content: 'REST API.',
                subsections: [
                    {
                        name: 'Endpoints',
                        level: 3,
                        content: 'GET /docs',
                        subsections: [],
                    },
                ],
            },
        ];
        const tree = normalize(doc);

        const structureToc = tree.toc[2];
        expect(structureToc.label).toBe('STRUCTURE');
        expect(structureToc.children).toHaveLength(1);
        expect(structureToc.children[0].label).toBe('API Layer');
        expect(structureToc.children[0].children).toHaveLength(1);
        expect(structureToc.children[0].children[0].label).toBe('Endpoints');
    });
});
