// ─────────────────────────────────────────────
// Unit Tests: Generation Module (Epic 3)
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { generatePlan } from '../generation/plan-generator';
import { generateTasks } from '../generation/task-generator';
import { injectSection, serializeDocument } from '../generation/section-injector';
import { MrcfDocument, LLMProvider, LLMResponse, LLMRequestOptions } from '../types';

// ── Mock Provider ────────────────────────────
class MockProvider implements LLMProvider {
    name = 'mock';

    async sendPrompt(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
        // Return different content based on what's being generated
        if (prompt.includes('Generate a PLAN')) {
            return {
                content: '## Phase 1 – Prototype\n\n- Build core parser\n- Create basic editor\n\n## Phase 2 – AI\n\n- Integrate LLM',
                model: 'mock-model',
                usage: { promptTokens: 100, completionTokens: 80, totalTokens: 180 },
            };
        }

        return {
            content: '- [ ] implement parser\n- [ ] build editor\n- [ ] connect AI service',
            model: 'mock-model',
            usage: { promptTokens: 80, completionTokens: 40, totalTokens: 120 },
        };
    }
}

// ── Test Documents ───────────────────────────
const sampleDoc: MrcfDocument = {
    metadata: { title: 'Test', version: '1.0', created: '2026-01-01' },
    sections: [
        { name: 'VISION', isStandard: true, content: 'Build a platform for structured docs.', subsections: [], tasks: [], assets: [] },
        { name: 'CONTEXT', isStandard: true, content: 'Target: developers.', subsections: [], tasks: [], assets: [] },
        { name: 'STRUCTURE', isStandard: true, content: 'API + Editor + AI', subsections: [], tasks: [], assets: [] },
    ],
    assets: [],
    sectionIndex: new Map()
};

const docWithPlan: MrcfDocument = {
    ...sampleDoc,
    sections: [
        ...sampleDoc.sections,
        { name: 'PLAN', isStandard: true, content: 'Phase 1: Build parser\nPhase 2: Add AI', subsections: [], tasks: [], assets: [] },
    ],
};

// ─────────────────────────────────────────────
// Plan Generator Tests
// ─────────────────────────────────────────────

describe('generatePlan', () => {
    it('generates a PLAN section', async () => {
        const provider = new MockProvider();
        const result = await generatePlan(sampleDoc, provider);

        expect(result.sectionName).toBe('PLAN');
        expect(result.content).toContain('Phase 1');
        expect(result.model).toBe('mock-model');
        expect(result.tokensUsed).toBe(180);
    });

    it('throws if VISION is missing', async () => {
        const noVision: MrcfDocument = {
            metadata: { title: 'T', version: '1', created: '2026-01-01' },
            sections: [{ name: 'CONTEXT', isStandard: true, content: 'x', subsections: [], tasks: [], assets: [] }],
            assets: [],
            sectionIndex: new Map()
        };

        const provider = new MockProvider();
        await expect(generatePlan(noVision, provider)).rejects.toThrow('VISION section is missing');
    });
});

// ─────────────────────────────────────────────
// Task Generator Tests
// ─────────────────────────────────────────────

describe('generateTasks', () => {
    it('generates TASKS from PLAN', async () => {
        const provider = new MockProvider();
        const result = await generateTasks(docWithPlan, provider);

        expect(result.sectionName).toBe('TASKS');
        expect(result.content).toContain('- [ ]');
        expect(result.tokensUsed).toBe(120);
    });

    it('throws if PLAN is missing', async () => {
        const provider = new MockProvider();
        await expect(generateTasks(sampleDoc, provider)).rejects.toThrow('PLAN section is missing');
    });
});

// ─────────────────────────────────────────────
// Section Injector Tests
// ─────────────────────────────────────────────

describe('injectSection', () => {
    const genResult = {
        sectionName: 'PLAN',
        content: 'New plan content',
        model: 'mock',
        tokensUsed: 100,
    };

    it('creates new section when it doesn\'t exist', () => {
        const updated = injectSection(sampleDoc, genResult);
        const plan = updated.sections.find((s) => s.name === 'PLAN');
        expect(plan).toBeDefined();
        expect(plan!.content).toBe('New plan content');
    });

    it('inserts new section in canonical order', () => {
        const updated = injectSection(sampleDoc, genResult);
        const names = updated.sections.map((s) => s.name);
        expect(names.indexOf('PLAN')).toBeGreaterThan(names.indexOf('STRUCTURE'));
    });

    it('replaces existing section in replace mode', () => {
        const updated = injectSection(docWithPlan, genResult, 'replace');
        const plan = updated.sections.find((s) => s.name === 'PLAN');
        expect(plan!.content).toBe('New plan content');
    });

    it('appends to existing section in append mode', () => {
        const updated = injectSection(docWithPlan, genResult, 'append');
        const plan = updated.sections.find((s) => s.name === 'PLAN');
        expect(plan!.content).toContain('Phase 1');
        expect(plan!.content).toContain('New plan content');
    });

    it('does nothing in create mode if section exists', () => {
        const updated = injectSection(docWithPlan, genResult, 'create');
        const plan = updated.sections.find((s) => s.name === 'PLAN');
        expect(plan!.content).toBe('Phase 1: Build parser\nPhase 2: Add AI');
    });

    it('does not mutate original document', () => {
        const originalSections = JSON.parse(JSON.stringify(sampleDoc.sections));
        injectSection(sampleDoc, genResult);
        expect(sampleDoc.sections).toEqual(originalSections);
    });
});

// ─────────────────────────────────────────────
// Serializer Tests
// ─────────────────────────────────────────────

describe('serializeDocument', () => {
    it('serializes metadata and sections', () => {
        const serialized = serializeDocument(sampleDoc);
        expect(serialized).toContain('---');
        expect(serialized).toContain('title: Test');
        expect(serialized).toContain('# VISION');
        expect(serialized).toContain('Build a platform');
    });

    it('serializes tags as YAML array', () => {
        const docWithTags = {
            ...sampleDoc,
            metadata: { ...sampleDoc.metadata, tags: ['ai', 'docs'] },
        };
        const serialized = serializeDocument(docWithTags);
        expect(serialized).toContain('tags:');
        expect(serialized).toContain('  - ai');
        expect(serialized).toContain('  - docs');
    });

    it('round-trips through parse and serialize', () => {
        const serialized = serializeDocument(docWithPlan);
        const { parseMrcfDocument } = require('../analysis/section-extractor');
        const reparsed = parseMrcfDocument(serialized);

        expect(reparsed.metadata.title).toBe('Test');
        expect(reparsed.sections.length).toBeGreaterThanOrEqual(4);
    });
});
