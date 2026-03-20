// ─────────────────────────────────────────────
// Unit Tests: Prompt Templates
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { renderTemplate, TEMPLATES } from '../prompt-templates';

describe('renderTemplate', () => {
    it('replaces single variable', () => {
        const result = renderTemplate(TEMPLATES.analyzeDocument, {
            document: 'Test document content',
        });

        expect(result.userPrompt).toContain('Test document content');
        expect(result.userPrompt).not.toContain('{{document}}');
        expect(result.systemPrompt).toBeTruthy();
    });

    it('replaces multiple variables', () => {
        const result = renderTemplate(TEMPLATES.generatePlan, {
            vision: 'Build an app',
            context: 'For developers',
            structure: 'API + Frontend',
        });

        expect(result.userPrompt).toContain('Build an app');
        expect(result.userPrompt).toContain('For developers');
        expect(result.userPrompt).toContain('API + Frontend');
        expect(result.userPrompt).not.toContain('{{vision}}');
    });

    it('replaces multiple occurrences of same variable', () => {
        const template = {
            name: 'test',
            description: 'test',
            systemPrompt: 'system',
            userPromptTemplate: '{{name}} and {{name}}',
        };

        const result = renderTemplate(template, { name: 'Alice' });
        expect(result.userPrompt).toBe('Alice and Alice');
    });

    it('preserves system prompt unchanged', () => {
        const result = renderTemplate(TEMPLATES.generateTasks, {
            plan: 'Phase 1',
            structure: 'Backend',
        });

        expect(result.systemPrompt).toBe(TEMPLATES.generateTasks.systemPrompt);
    });
});

describe('TEMPLATES', () => {
    it('has all required templates', () => {
        expect(TEMPLATES.analyzeDocument).toBeDefined();
        expect(TEMPLATES.generatePlan).toBeDefined();
        expect(TEMPLATES.generateTasks).toBeDefined();
        expect(TEMPLATES.consistencyCheck).toBeDefined();
    });

    it('all templates have required fields', () => {
        for (const [key, template] of Object.entries(TEMPLATES)) {
            expect(template.name).toBeTruthy();
            expect(template.description).toBeTruthy();
            expect(template.systemPrompt).toBeTruthy();
            expect(template.userPromptTemplate).toBeTruthy();
        }
    });
});
