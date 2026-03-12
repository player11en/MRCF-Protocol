// ─────────────────────────────────────────────
// Prompt Templates for KDOC AI Operations
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { PromptTemplate } from './types';

/**
 * Renders a prompt template by replacing {{variable}} placeholders.
 */
export function renderTemplate(
    template: PromptTemplate,
    variables: Record<string, string>
): { systemPrompt: string; userPrompt: string } {
    let userPrompt = template.userPromptTemplate;

    for (const [key, value] of Object.entries(variables)) {
        userPrompt = userPrompt.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
            value
        );
    }

    return {
        systemPrompt: template.systemPrompt,
        userPrompt,
    };
}

// ─────────────────────────────────────────────
// Built-in Templates
// ─────────────────────────────────────────────

export const TEMPLATES = {
    /**
     * Analyze a KDOC document for consistency and completeness.
     * Variables: {{document}}
     */
    analyzeDocument: {
        name: 'analyze-document',
        description: 'Analyze a .mrcf document for consistency and completeness',
        systemPrompt: [
            'You are an expert document analyst for the KDOC format.',
            'KDOC documents have five standard sections: VISION, CONTEXT, STRUCTURE, PLAN, TASKS.',
            'Your job is to analyze documents for:',
            '- Missing or incomplete sections',
            '- Contradictions between sections (e.g. TASKS that don\'t align with PLAN)',
            '- Vague or unclear content that would hinder AI or human collaboration',
            '',
            'Respond in JSON format:',
            '{',
            '  "warnings": [{ "section": "...", "message": "...", "severity": "info|warning|error" }],',
            '  "suggestions": [{ "section": "...", "suggestion": "..." }]',
            '}',
        ].join('\n'),
        userPromptTemplate: [
            'Analyze the following KDOC document:',
            '',
            '{{document}}',
        ].join('\n'),
    } as PromptTemplate,

    /**
     * Generate a PLAN section from VISION + CONTEXT + STRUCTURE.
     * Variables: {{vision}}, {{context}}, {{structure}}
     */
    generatePlan: {
        name: 'generate-plan',
        description: 'Generate a PLAN section from VISION, CONTEXT, and STRUCTURE',
        systemPrompt: [
            'You are an expert project planner working with the KDOC document format.',
            'Given the VISION, CONTEXT, and STRUCTURE of a project, generate a concrete PLAN section.',
            'The PLAN should include:',
            '- Clear phases with descriptive names',
            '- Milestones for each phase',
            '- Logical ordering based on dependencies',
            '',
            'Output ONLY the PLAN content in Markdown format (no section header).',
            'Use ## for phases and bullet points for milestones.',
        ].join('\n'),
        userPromptTemplate: [
            '# VISION',
            '{{vision}}',
            '',
            '# CONTEXT',
            '{{context}}',
            '',
            '# STRUCTURE',
            '{{structure}}',
            '',
            'Generate a PLAN section for this project.',
        ].join('\n'),
    } as PromptTemplate,

    /**
     * Generate TASKS from a PLAN section.
     * Variables: {{plan}}, {{structure}}
     */
    generateTasks: {
        name: 'generate-tasks',
        description: 'Generate TASKS from PLAN and STRUCTURE',
        systemPrompt: [
            'You are an expert task breakdown specialist for the KDOC format.',
            'Given a PLAN and STRUCTURE, generate concrete TASKS.',
            'Tasks must use Markdown checkbox format: - [ ] task description',
            'Group tasks by phase or component using ## headers.',
            '',
            'Output ONLY the TASKS content (no # TASKS header).',
            'Each task should be actionable and specific.',
        ].join('\n'),
        userPromptTemplate: [
            '# PLAN',
            '{{plan}}',
            '',
            '# STRUCTURE',
            '{{structure}}',
            '',
            'Generate concrete TASKS from this plan.',
        ].join('\n'),
    } as PromptTemplate,

    /**
     * Check consistency between all sections.
     * Variables: {{document}}
     */
    consistencyCheck: {
        name: 'consistency-check',
        description: 'Check consistency across all document sections',
        systemPrompt: [
            'You are a consistency auditor for KDOC documents.',
            'Check whether:',
            '- PLAN aligns with VISION goals',
            '- TASKS cover all items in PLAN',
            '- STRUCTURE matches what PLAN describes',
            '- No orphan tasks exist without a plan reference',
            '',
            'Respond in JSON format:',
            '{',
            '  "consistent": true|false,',
            '  "issues": [{ "section": "...", "relatedSection": "...", "message": "..." }]',
            '}',
        ].join('\n'),
        userPromptTemplate: [
            'Check consistency across all sections of this KDOC document:',
            '',
            '{{document}}',
        ].join('\n'),
    } as PromptTemplate,
} as const;
