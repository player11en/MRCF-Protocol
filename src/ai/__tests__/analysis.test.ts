// ─────────────────────────────────────────────
// Unit Tests: Analysis Module (Epic 2)
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { buildContext, getSection } from '../analysis/context-builder';
import { extractMetadata, parseMrcfDocument, listPresentSections } from '../analysis/section-extractor';
import { analyzeDocument } from '../analysis/consistency-checker';
import { MrcfDocument, LLMProvider, LLMResponse, LLMRequestOptions } from '../types';

// ── Mock Provider ────────────────────────────
class MockProvider implements LLMProvider {
    name = 'mock';
    lastPrompt = '';

    async sendPrompt(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
        this.lastPrompt = prompt;
        return {
            content: JSON.stringify({
                warnings: [{ section: 'PLAN', message: 'Could be more specific', severity: 'info' }],
                suggestions: [{ section: 'TASKS', suggestion: 'Add deadlines' }],
            }),
            model: 'mock-model',
            usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        };
    }
}

// ── Test Documents ───────────────────────────
const sampleDoc: MrcfDocument = {
    metadata: { title: 'Test', version: '1.0', created: '2026-01-01' },
    sections: [
        { name: 'VISION', isStandard: true, content: 'Build a platform', subsections: [], tasks: [], assets: [] },
        { name: 'CONTEXT', isStandard: true, content: 'For developers', subsections: [], tasks: [], assets: [] },
        {
            name: 'STRUCTURE',
            isStandard: true,
            content: '',
            subsections: [
                { name: 'API', level: 2, content: 'REST endpoints', subsections: [] },
                { name: 'DB', level: 2, content: 'Postgres', subsections: [] },
            ],
            tasks: [],
            assets: []
        },
        { name: 'PLAN', isStandard: true, content: 'Phase 1: Prototype', subsections: [], tasks: [], assets: [] },
        { name: 'TASKS', isStandard: true, content: '- [ ] build API', subsections: [], tasks: [], assets: [] },
    ],
    assets: [],
    sectionIndex: new Map()
};

// ─────────────────────────────────────────────
// Context Builder Tests
// ─────────────────────────────────────────────

describe('buildContext', () => {
    it('builds context with all sections in canonical order', () => {
        const context = buildContext(sampleDoc);
        expect(context).toContain('# VISION');
        expect(context).toContain('# PLAN');

        // Check order: VISION before PLAN
        const visionIdx = context.indexOf('# VISION');
        const planIdx = context.indexOf('# PLAN');
        expect(visionIdx).toBeLessThan(planIdx);
    });

    it('filters by section name', () => {
        const context = buildContext(sampleDoc, { includeSections: ['VISION', 'PLAN'] });
        expect(context).toContain('VISION');
        expect(context).toContain('PLAN');
        expect(context).not.toContain('CONTEXT');
        expect(context).not.toContain('STRUCTURE');
    });

    it('includes subsections by default', () => {
        const context = buildContext(sampleDoc, { includeSections: ['STRUCTURE'] });
        expect(context).toContain('API');
        expect(context).toContain('REST endpoints');
    });

    it('excludes subsections when requested', () => {
        const context = buildContext(sampleDoc, {
            includeSections: ['STRUCTURE'],
            includeSubsections: false,
        });
        expect(context).not.toContain('REST endpoints');
    });

    it('truncates when over character budget', () => {
        const context = buildContext(sampleDoc, { maxCharacters: 50 });
        expect(context.length).toBeLessThanOrEqual(70); // 50 + "\n\n[...truncated]" text
        expect(context).toContain('[...truncated]');
    });
});

describe('getSection', () => {
    it('finds section by name (case insensitive)', () => {
        const section = getSection(sampleDoc, 'vision');
        expect(section?.name).toBe('VISION');
    });

    it('returns undefined for missing section', () => {
        const section = getSection(sampleDoc, 'NONEXISTENT');
        expect(section).toBeUndefined();
    });
});

// ─────────────────────────────────────────────
// Section Extractor Tests
// ─────────────────────────────────────────────

describe('extractMetadata', () => {
    it('extracts metadata from YAML header', () => {
        const raw = `---\ntitle: My Project\nversion: 1.0\ncreated: 2026-03-12\nauthor: Team\n---\n\n# VISION\nTest`;
        const meta = extractMetadata(raw);
        expect(meta.title).toBe('My Project');
        expect(meta.version).toBe('1.0');
        expect(meta.author).toBe('Team');
    });

    it('extracts tags as array', () => {
        const raw = `---\ntitle: Project\nversion: 1.0\ncreated: 2026-01-01\ntags:\n  - ai\n  - docs\n---`;
        const meta = extractMetadata(raw);
        expect(meta.tags).toEqual(['ai', 'docs']);
    });

    it('returns defaults for missing metadata', () => {
        const meta = extractMetadata('No metadata here');
        expect(meta.title).toBe('Untitled');
        expect(meta.version).toBe('0.1');
    });
});

describe('parseMrcfDocument', () => {
    it('parses a complete kdoc document', () => {
        const raw = `---\ntitle: Test\nversion: 1.0\ncreated: 2026-01-01\n---\n\n# VISION\n\nBuild something.\n\n# TASKS\n\n- [ ] task 1`;
        const doc = parseMrcfDocument(raw);
        expect(doc.metadata.title).toBe('Test');
        expect(doc.sections).toHaveLength(2);
        expect(doc.sections[0].name).toBe('VISION');
    });
});

describe('listPresentSections', () => {
    it('identifies present and missing sections', () => {
        const doc: MrcfDocument = {
            metadata: { title: 'T', version: '1', created: '2026-01-01' },
            sections: [
                { name: 'VISION', isStandard: true, content: 'x', subsections: [], tasks: [], assets: [] },
                { name: 'TASKS', isStandard: true, content: 'y', subsections: [], tasks: [], assets: [] },
            ],
            assets: [],
            sectionIndex: new Map()
        };

        const result = listPresentSections(doc);
        expect(result.present).toContain('VISION');
        expect(result.present).toContain('TASKS');
        expect(result.missing).toContain('CONTEXT');
        expect(result.missing).toContain('STRUCTURE');
        expect(result.missing).toContain('PLAN');
    });
});

// ─────────────────────────────────────────────
// Analyze Document Tests
// ─────────────────────────────────────────────

describe('analyzeDocument', () => {
    it('reports missing sections', async () => {
        const incompleteDoc: MrcfDocument = {
            metadata: { title: 'T', version: '1', created: '2026-01-01' },
            sections: [
                { name: 'VISION', isStandard: true, content: 'Build it', subsections: [], tasks: [], assets: [] },
                { name: 'PLAN', isStandard: true, content: 'Phase 1', subsections: [], tasks: [], assets: [] },
            ],
            assets: [],
            sectionIndex: new Map()
        };

        const provider = new MockProvider();
        const result = await analyzeDocument(incompleteDoc, provider);

        // Should have static warnings for missing sections
        const missingWarnings = result.warnings.filter((w) => w.message.includes('missing'));
        expect(missingWarnings.length).toBeGreaterThanOrEqual(3); // CONTEXT, STRUCTURE, TASKS
    });

    it('reports empty sections', async () => {
        const docWithEmpty: MrcfDocument = {
            metadata: { title: 'T', version: '1', created: '2026-01-01' },
            sections: [
                { name: 'VISION', isStandard: true, content: '', subsections: [], tasks: [], assets: [] },
                { name: 'CONTEXT', isStandard: true, content: 'x', subsections: [], tasks: [], assets: [] },
            ],
            assets: [],
            sectionIndex: new Map()
        };

        const provider = new MockProvider();
        const result = await analyzeDocument(docWithEmpty, provider);

        const emptyWarnings = result.warnings.filter((w) => w.message.includes('empty'));
        expect(emptyWarnings.length).toBeGreaterThanOrEqual(1);
    });

    it('includes LLM analysis results', async () => {
        const provider = new MockProvider();
        const result = await analyzeDocument(sampleDoc, provider);

        // Should include the mock LLM's suggestions
        const llmSuggestion = result.suggestions.find((s) => s.suggestion === 'Add deadlines');
        expect(llmSuggestion).toBeDefined();
    });
});
