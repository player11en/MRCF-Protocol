// ─────────────────────────────────────────────
// Task Generator – Generate TASKS from PLAN
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { MrcfDocument, LLMProvider, GenerationResult } from '../types';
import { getSection, getSectionText } from '../analysis/context-builder';
import { TEMPLATES, renderTemplate } from '../prompt-templates';
import { parseSectionContent } from '../response-parser';

/**
 * Generates a TASKS section from the document's PLAN and STRUCTURE.
 * Tasks are output in Markdown checkbox format per the MRCF spec.
 *
 * @throws Error if PLAN section is missing.
 */
export async function generateTasks(
    document: MrcfDocument,
    provider: LLMProvider
): Promise<GenerationResult> {
    const plan = getSection(document, 'PLAN');
    if (!plan) {
        throw new Error('Cannot generate TASKS: PLAN section is missing.');
    }

    const structure = getSection(document, 'STRUCTURE');

    const variables = {
        plan: getSectionText(plan),
        structure: structure ? getSectionText(structure) : '(not provided)',
    };

    const { systemPrompt, userPrompt } = renderTemplate(
        TEMPLATES.generateTasks,
        variables
    );

    const response = await provider.sendPrompt(userPrompt, {
        systemPrompt,
        temperature: 0.5,
        maxTokens: 2048,
    });

    const content = parseSectionContent(response.content, 'TASKS');

    return {
        sectionName: 'TASKS',
        content,
        model: response.model,
        tokensUsed: response.usage.totalTokens,
    };
}
