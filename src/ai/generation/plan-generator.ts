// ─────────────────────────────────────────────
// Plan Generator – Generate PLAN from VISION+CONTEXT+STRUCTURE
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { MrcfDocument, LLMProvider, GenerationResult } from '../types';
import { getSection, getSectionText } from '../analysis/context-builder';
import { TEMPLATES, renderTemplate } from '../prompt-templates';
import { parseSectionContent } from '../response-parser';

/**
 * Generates a PLAN section from the document's VISION, CONTEXT, and STRUCTURE.
 *
 * @throws Error if required sections (VISION) are missing.
 */
export async function generatePlan(
    document: MrcfDocument,
    provider: LLMProvider
): Promise<GenerationResult> {
    const vision = getSection(document, 'VISION');
    if (!vision) {
        throw new Error('Cannot generate PLAN: VISION section is missing.');
    }

    const context = getSection(document, 'CONTEXT');
    const structure = getSection(document, 'STRUCTURE');

    const variables = {
        vision: getSectionText(vision),
        context: context ? getSectionText(context) : '(not provided)',
        structure: structure ? getSectionText(structure) : '(not provided)',
    };

    const { systemPrompt, userPrompt } = renderTemplate(
        TEMPLATES.generatePlan,
        variables
    );

    const response = await provider.sendPrompt(userPrompt, {
        systemPrompt,
        temperature: 0.7,
        maxTokens: 2048,
    });

    const content = parseSectionContent(response.content, 'PLAN');

    return {
        sectionName: 'PLAN',
        content,
        model: response.model,
        tokensUsed: response.usage.totalTokens,
    };
}
