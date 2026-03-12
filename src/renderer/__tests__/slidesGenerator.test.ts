/**
 * Slides Generator Tests — Developer 4
 */

import { generateSlideDeck, renderSlides } from '../slidesGenerator';
import type { MrcfDocument, MrcfSection } from '@mrcf/parser';

function makeDoc(overrides?: Partial<MrcfDocument>): MrcfDocument {
    const defaults: MrcfDocument = {
        metadata: {
            title: 'Test Presentation',
            version: '1.0',
            created: '2026-03-12',
            author: 'Presenter',
        },
        sections: [
            makeSection('VISION', 'Build something great.', true),
            makeSection('CONTEXT', 'For developers and architects.', true),
            makeSection('STRUCTURE', 'Modular system.', true),
            makeSection('PLAN', 'Phase 1: Build.\nPhase 2: Scale.', true),
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

describe('generateSlideDeck', () => {
    it('creates a title slide from metadata', () => {
        const doc = makeDoc();
        const deck = generateSlideDeck(doc);

        expect(deck.slides[0].type).toBe('title');
        expect(deck.slides[0].title).toBe('Test Presentation');
        expect(deck.slides[0].subtitle).toContain('Presenter');
    });

    it('produces at least one slide per section plus the title', () => {
        const doc = makeDoc();
        const deck = generateSlideDeck(doc);

        // 1 title + 5 sections = at least 6 slides
        expect(deck.slides.length).toBeGreaterThanOrEqual(6);
    });

    it('maps sections to correct slide types', () => {
        const doc = makeDoc();
        const deck = generateSlideDeck(doc);

        // Skip title slide [0]
        expect(deck.slides[1].type).toBe('intro');       // VISION
        expect(deck.slides[2].type).toBe('problem');      // CONTEXT
        expect(deck.slides[3].type).toBe('architecture'); // STRUCTURE
        expect(deck.slides[4].type).toBe('roadmap');      // PLAN
        expect(deck.slides[5].type).toBe('next-steps');   // TASKS
    });

    it('chunks long sections into multiple slides', () => {
        const longContent = Array(30).fill('This is a long paragraph with enough text to exceed the slide limit.').join('\n\n');
        const doc = makeDoc({
            sections: [
                makeSection('VISION', longContent, true),
                makeSection('CONTEXT', 'Short.', true),
                makeSection('STRUCTURE', 'Short.', true),
                makeSection('PLAN', 'Short.', true),
                makeSection('TASKS', '', true),
            ],
        });
        doc.sectionIndex = new Map(doc.sections.map((s) => [s.name, s]));
        const deck = generateSlideDeck(doc);

        // VISION should be split into multiple slides
        const visionSlides = deck.slides.filter((s) => s.title.startsWith('VISION'));
        expect(visionSlides.length).toBeGreaterThan(1);
    });

    it('numbers slides sequentially', () => {
        const doc = makeDoc();
        const deck = generateSlideDeck(doc);

        for (let i = 0; i < deck.slides.length; i++) {
            expect(deck.slides[i].number).toBe(i + 1);
        }
    });

    it('sets total slide count', () => {
        const doc = makeDoc();
        const deck = generateSlideDeck(doc);

        expect(deck.totalSlides).toBe(deck.slides.length);
    });

    it('handles custom sections with content type', () => {
        const doc = makeDoc();
        doc.sections.push(makeSection('CUSTOM', 'Custom content.', false));
        doc.sectionIndex = new Map(doc.sections.map((s) => [s.name, s]));
        const deck = generateSlideDeck(doc);

        const customSlides = deck.slides.filter((s) => s.title.startsWith('CUSTOM'));
        expect(customSlides.length).toBeGreaterThanOrEqual(1);
        expect(customSlides[0].type).toBe('content');
    });
});

describe('renderSlides', () => {
    it('produces a self-contained HTML document', () => {
        const doc = makeDoc();
        const html = renderSlides(doc);

        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html');
        expect(html).toContain('</html>');
        expect(html).toContain('<style>');
        expect(html).toContain('<script>');
    });

    it('includes all slides', () => {
        const doc = makeDoc();
        const html = renderSlides(doc);

        expect(html).toContain('data-slide="1"');
        expect(html).toContain('data-slide="2"');
        expect(html).toContain('Test Presentation');
    });

    it('includes navigation JS', () => {
        const doc = makeDoc();
        const html = renderSlides(doc);

        expect(html).toContain('ArrowRight');
        expect(html).toContain('ArrowLeft');
    });

    it('includes slide type CSS classes', () => {
        const doc = makeDoc();
        const html = renderSlides(doc);

        expect(html).toContain('slide-title');
        expect(html).toContain('slide-intro');
        expect(html).toContain('slide-problem');
    });

    it('snapshot: slide deck HTML', () => {
        const doc = makeDoc();
        const html = renderSlides(doc);
        expect(html).toMatchSnapshot();
    });
});
