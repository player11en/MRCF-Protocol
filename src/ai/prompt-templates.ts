// ─────────────────────────────────────────────
// Prompt Templates for MRCF AI Operations — v2
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
     * Analyze an MRCF document for consistency and completeness.
     * Variables: {{document}}
     */
    analyzeDocument: {
        name: 'analyze-document',
        description: 'Analyze a .mrcf document for consistency and completeness',
        systemPrompt: [
            'You are an expert document analyst for the MRCF format (Machine-Readable Context Format).',
            'MRCF v2 documents have five required sections: VISION, CONTEXT, STRUCTURE, PLAN, TASKS.',
            'Optional sections include: SUMMARY, INSIGHTS, DECISIONS, REFERENCES.',
            'Your job is to analyze documents for:',
            '- Missing or incomplete sections',
            '- Contradictions between sections (e.g. TASKS that don\'t align with PLAN)',
            '- Vague or unclear content that would hinder AI or human collaboration',
            '- INSIGHTS that are missing for completed or failed tasks',
            '- DECISIONS that should be documented but are not',
            '',
            'Respond in JSON format:',
            '{',
            '  "warnings": [{ "section": "...", "message": "...", "severity": "info|warning|error" }],',
            '  "suggestions": [{ "section": "...", "suggestion": "..." }]',
            '}',
        ].join('\n'),
        userPromptTemplate: [
            'Analyze the following MRCF document:',
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
            'You are an expert project planner working with the MRCF document format.',
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
            'You are an expert task breakdown specialist for the MRCF format.',
            'Given a PLAN and STRUCTURE, generate concrete TASKS in MRCF v2 block format.',
            '',
            'Use this format for each task:',
            '[TASK-N]',
            'description: what needs to be done',
            'status: planned',
            'owner: (leave blank if unknown)',
            'depends_on: [TASK-X, TASK-Y] or []',
            'related_insights: []',
            '',
            'Output ONLY the TASKS content (no # TASKS header).',
            'Each task should be actionable and specific.',
            'Number tasks sequentially starting from TASK-1.',
        ].join('\n'),
        userPromptTemplate: [
            '# PLAN',
            '{{plan}}',
            '',
            '# STRUCTURE',
            '{{structure}}',
            '',
            'Generate concrete TASKS from this plan in MRCF v2 block format.',
        ].join('\n'),
    } as PromptTemplate,

    /**
     * Generate an INSIGHTS section from completed/failed TASKS.
     * Variables: {{tasks}}, {{plan}}
     */
    generateInsights: {
        name: 'generate-insights',
        description: 'Generate INSIGHTS from TASKS outcomes',
        systemPrompt: [
            'You are a learning analyst for MRCF documents.',
            'Given the TASKS section (with statuses) and the PLAN, identify learnings.',
            '',
            'Use this format for each insight:',
            '[INSIGHT-N]',
            'type: success | failure | observation',
            'description: what was learned',
            'confidence: 0.0 to 1.0',
            'source: TASK-N (the task this came from)',
            '',
            'Rules:',
            '- Only generate insights for tasks with status: done, failed, or blocked',
            '- type=success for done tasks with notable positive outcomes',
            '- type=failure for failed or blocked tasks',
            '- type=observation for neutral learnings',
            '- confidence reflects how certain this insight is (0.9 = very certain)',
            '',
            'Output ONLY the INSIGHTS content (no # INSIGHTS header).',
        ].join('\n'),
        userPromptTemplate: [
            '# PLAN',
            '{{plan}}',
            '',
            '# TASKS',
            '{{tasks}}',
            '',
            'Generate INSIGHTS from the completed, failed, and blocked tasks above.',
        ].join('\n'),
    } as PromptTemplate,

    /**
     * Generate a DECISIONS section from STRUCTURE and PLAN.
     * Variables: {{structure}}, {{plan}}
     */
    generateDecisions: {
        name: 'generate-decisions',
        description: 'Generate DECISIONS from STRUCTURE and PLAN',
        systemPrompt: [
            'You are an architectural decision analyst for MRCF documents.',
            'Given the STRUCTURE and PLAN, identify key decisions that should be documented.',
            '',
            'Use this format for each decision:',
            '[DEC-N]',
            'choice: the option that was or should be chosen',
            'reason: why this option is best',
            'alternatives: other options considered (comma-separated)',
            'impact: low | medium | high',
            '',
            'Focus on decisions that:',
            '- Have meaningful trade-offs',
            '- Could be revisited later',
            '- Affect multiple parts of the system',
            '',
            'Output ONLY the DECISIONS content (no # DECISIONS header).',
        ].join('\n'),
        userPromptTemplate: [
            '# STRUCTURE',
            '{{structure}}',
            '',
            '# PLAN',
            '{{plan}}',
            '',
            'Generate DECISIONS that should be documented for this project.',
        ].join('\n'),
    } as PromptTemplate,

    /**
     * Generate a SUMMARY section from the full document state.
     * Variables: {{document}}
     */
    generateSummary: {
        name: 'generate-summary',
        description: 'Generate a SUMMARY snapshot of current project state',
        systemPrompt: [
            'You are a project state analyst for MRCF documents.',
            'Generate a concise SUMMARY section that gives an AI instant orientation.',
            '',
            'Use ONLY these three fields:',
            'current_focus: what is actively being worked on right now',
            'main_risk: the single biggest risk at this moment',
            'stable_parts: which parts of the project are settled and unlikely to change',
            '',
            'Keep each value to one sentence. Be specific, not generic.',
            'Output ONLY the three key-value lines (no # SUMMARY header, no extra text).',
        ].join('\n'),
        userPromptTemplate: [
            'Generate a SUMMARY for this MRCF document:',
            '',
            '{{document}}',
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
            'You are a consistency auditor for MRCF documents.',
            'Check whether:',
            '- PLAN aligns with VISION goals',
            '- TASKS cover all items in PLAN',
            '- STRUCTURE matches what PLAN describes',
            '- No orphan tasks exist without a plan reference',
            '- INSIGHTS reference tasks that actually exist',
            '- DECISIONS are consistent with STRUCTURE choices',
            '- REFERENCES point to entities that exist in TASKS, INSIGHTS, or DECISIONS',
            '',
            'Respond in JSON format:',
            '{',
            '  "consistent": true|false,',
            '  "issues": [{ "section": "...", "relatedSection": "...", "message": "..." }]',
            '}',
        ].join('\n'),
        userPromptTemplate: [
            'Check consistency across all sections of this MRCF document:',
            '',
            '{{document}}',
        ].join('\n'),
    } as PromptTemplate,
} as const;
