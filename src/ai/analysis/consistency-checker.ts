// ─────────────────────────────────────────────
// Consistency Checker – Detect contradictions in MRCF documents
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import {
    MrcfDocument,
    LLMProvider,
    AnalysisResult,
    AnalysisWarning,
    AnalysisSuggestion,
} from '../types';
import { buildContext } from './context-builder';
import { listPresentSections } from './section-extractor';
import { TEMPLATES, renderTemplate } from '../prompt-templates';
import { parseAnalysisResponse, parseConsistencyResponse } from '../response-parser';

/**
 * Performs a full document analysis:
 * 1. Static checks (missing sections, empty content)
 * 2. LLM-powered consistency check
 */
export async function analyzeDocument(
    document: MrcfDocument,
    provider: LLMProvider
): Promise<AnalysisResult> {
    const warnings: AnalysisWarning[] = [];
    const suggestions: AnalysisSuggestion[] = [];

    // ── Static Checks ──────────────────────────
    const { missing } = listPresentSections(document);

    for (const section of missing) {
        warnings.push({
            section,
            message: `Required section "${section}" is missing.`,
            severity: 'error',
        });
        suggestions.push({
            section,
            suggestion: `Add a # ${section} section to the document.`,
        });
    }

    // Check for empty sections
    for (const section of document.sections) {
        if (!section.content.trim() && section.subsections.length === 0) {
            warnings.push({
                section: section.name,
                message: `Section "${section.name}" is empty.`,
                severity: 'warning',
            });
        }
    }

    // ── LLM-powered analysis ──────────────────
    if (document.sections.length >= 2) {
        try {
            const context = buildContext(document);
            const { systemPrompt, userPrompt } = renderTemplate(
                TEMPLATES.analyzeDocument,
                { document: context }
            );

            const response = await provider.sendPrompt(userPrompt, {
                systemPrompt,
                temperature: 0.3,
            });

            const llmResult = parseAnalysisResponse(response.content);
            warnings.push(...llmResult.warnings);
            suggestions.push(...llmResult.suggestions);
        } catch (error) {
            warnings.push({
                section: 'general',
                message: `AI analysis failed: ${error instanceof Error ? error.message : String(error)}`,
                severity: 'info',
            });
        }
    }

    return { warnings, suggestions };
}

/**
 * Runs a targeted consistency check between sections.
 */
export async function checkConsistency(
    document: MrcfDocument,
    provider: LLMProvider
): Promise<{ consistent: boolean; issues: Array<{ section: string; relatedSection: string; message: string }> }> {
    const context = buildContext(document);
    const { systemPrompt, userPrompt } = renderTemplate(
        TEMPLATES.consistencyCheck,
        { document: context }
    );

    const response = await provider.sendPrompt(userPrompt, {
        systemPrompt,
        temperature: 0.2,
    });

    return parseConsistencyResponse(response.content);
}
