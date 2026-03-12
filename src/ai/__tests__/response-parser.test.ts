// ─────────────────────────────────────────────
// Unit Tests: Response Parser
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import {
    parseJsonResponse,
    parseAnalysisResponse,
    parseConsistencyResponse,
    parseSectionContent,
    extractSections,
} from '../response-parser';

describe('parseJsonResponse', () => {
    it('parses raw JSON', () => {
        const result = parseJsonResponse<{ name: string }>('{"name": "test"}');
        expect(result.name).toBe('test');
    });

    it('parses JSON in markdown code block', () => {
        const raw = '```json\n{"name": "test"}\n```';
        const result = parseJsonResponse<{ name: string }>(raw);
        expect(result.name).toBe('test');
    });

    it('parses JSON embedded in text', () => {
        const raw = 'Here is the result:\n{"name": "test"}\nDone.';
        const result = parseJsonResponse<{ name: string }>(raw);
        expect(result.name).toBe('test');
    });

    it('throws on invalid JSON', () => {
        expect(() => parseJsonResponse('not json at all')).toThrow('Failed to parse JSON');
    });
});

describe('parseAnalysisResponse', () => {
    it('parses valid analysis JSON', () => {
        const raw = JSON.stringify({
            warnings: [{ section: 'PLAN', message: 'Too vague', severity: 'warning' }],
            suggestions: [{ section: 'TASKS', suggestion: 'Add more tasks' }],
        });

        const result = parseAnalysisResponse(raw);
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].section).toBe('PLAN');
        expect(result.suggestions).toHaveLength(1);
    });

    it('falls back to single warning on non-JSON', () => {
        const result = parseAnalysisResponse('The document looks good overall.');
        expect(result.warnings).toHaveLength(1);
        expect(result.warnings[0].section).toBe('general');
        expect(result.suggestions).toHaveLength(0);
    });
});

describe('parseConsistencyResponse', () => {
    it('parses valid consistency JSON', () => {
        const raw = JSON.stringify({
            consistent: true,
            issues: [],
        });

        const result = parseConsistencyResponse(raw);
        expect(result.consistent).toBe(true);
        expect(result.issues).toHaveLength(0);
    });

    it('handles parse failure gracefully', () => {
        const result = parseConsistencyResponse('invalid');
        expect(result.consistent).toBe(false);
        expect(result.issues).toHaveLength(1);
    });
});

describe('parseSectionContent', () => {
    it('returns content as-is when clean', () => {
        const result = parseSectionContent('Phase 1\nPhase 2', 'PLAN');
        expect(result).toBe('Phase 1\nPhase 2');
    });

    it('strips leading section header', () => {
        const result = parseSectionContent('# PLAN\nPhase 1', 'PLAN');
        expect(result).toBe('Phase 1');
    });

    it('strips code block wrapper', () => {
        const result = parseSectionContent('```markdown\nPhase 1\n```', 'PLAN');
        expect(result).toBe('Phase 1');
    });
});

describe('extractSections', () => {
    it('extracts standard sections from raw document', () => {
        const raw = `# VISION\n\nBuild something great.\n\n# PLAN\n\nPhase 1\nPhase 2\n\n# TASKS\n\n- [ ] do stuff`;

        const sections = extractSections(raw);
        expect(sections).toHaveLength(3);
        expect(sections[0].name).toBe('VISION');
        expect(sections[0].content).toContain('Build something great');
        expect(sections[1].name).toBe('PLAN');
        expect(sections[2].name).toBe('TASKS');
    });

    it('handles subsections', () => {
        const raw = `# STRUCTURE\n\n## API Layer\n\nREST endpoints\n\n## Database\n\nPostgres`;

        const sections = extractSections(raw);
        expect(sections).toHaveLength(1);
        expect(sections[0].name).toBe('STRUCTURE');
        expect(sections[0].subsections).toHaveLength(2);
        expect(sections[0].subsections[0].name).toBe('API Layer');
        expect(sections[0].subsections[1].name).toBe('Database');
    });

    it('returns empty array for empty document', () => {
        expect(extractSections('')).toHaveLength(0);
    });
});
