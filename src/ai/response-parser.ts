// ─────────────────────────────────────────────
// Response Parser – Extract structured content from LLM output
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import {
    AnalysisResult,
    AnalysisWarning,
    AnalysisSuggestion,
    MrcfSection,
} from './types';
import { MrcfSubsection } from '@mrcf/parser';

/**
 * Attempts to parse a JSON response from LLM output.
 * Handles cases where JSON is wrapped in markdown code blocks.
 */
export function parseJsonResponse<T>(raw: string): T {
    // Try direct parse first
    try {
        return JSON.parse(raw);
    } catch {
        // Fall through to extraction
    }

    // Try extracting from markdown code block
    const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (codeBlockMatch) {
        try {
            return JSON.parse(codeBlockMatch[1].trim());
        } catch {
            // Fall through
        }
    }

    // Try finding first { ... } or [ ... ] block
    const jsonMatch = raw.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[1]);
        } catch {
            // Fall through
        }
    }

    throw new Error(`Failed to parse JSON from LLM response: ${raw.slice(0, 200)}...`);
}

/**
 * Parse analysis response from LLM into structured AnalysisResult.
 */
export function parseAnalysisResponse(raw: string): AnalysisResult {
    try {
        const parsed = parseJsonResponse<{
            warnings?: AnalysisWarning[];
            suggestions?: AnalysisSuggestion[];
        }>(raw);

        return {
            warnings: (parsed.warnings ?? []).map((w) => ({
                section: w.section ?? 'unknown',
                message: w.message ?? '',
                severity: w.severity ?? 'info',
            })),
            suggestions: (parsed.suggestions ?? []).map((s) => ({
                section: s.section ?? 'unknown',
                suggestion: s.suggestion ?? '',
                generatedContent: s.generatedContent,
            })),
        };
    } catch {
        // Fallback: treat entire response as a single warning
        return {
            warnings: [
                {
                    section: 'general',
                    message: raw.trim(),
                    severity: 'info',
                },
            ],
            suggestions: [],
        };
    }
}

/**
 * Parse consistency check response from LLM.
 */
export function parseConsistencyResponse(
    raw: string
): { consistent: boolean; issues: Array<{ section: string; relatedSection: string; message: string }> } {
    try {
        return parseJsonResponse(raw);
    } catch {
        return {
            consistent: false,
            issues: [
                {
                    section: 'general',
                    relatedSection: 'general',
                    message: `Could not parse consistency check response: ${raw.slice(0, 200)}`,
                },
            ],
        };
    }
}

/**
 * Parse generated section content from LLM output.
 * Strips any leading "# SECTION_NAME" header if present.
 */
export function parseSectionContent(raw: string, sectionName: string): string {
    let content = raw.trim();

    // Remove leading section header if LLM included it
    const headerPattern = new RegExp(`^#\\s*${sectionName}\\s*\\n`, 'i');
    content = content.replace(headerPattern, '');

    // Remove surrounding code block if present
    const codeBlockMatch = content.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n\s*```$/);
    if (codeBlockMatch) {
        content = codeBlockMatch[1];
    }

    return content.trim();
}

/**
 * Extract MRCF sections from raw document text.
 * Sections are identified by `# UPPERCASE_NAME` headers.
 */
export function extractSections(rawDocument: string): MrcfSection[] {
    const sections: MrcfSection[] = [];
    const lines = rawDocument.split('\n');
    let currentSection: MrcfSection | null = null;
    let currentSubsection: MrcfSubsection | null = null;
    const contentLines: string[] = [];

    const flushContent = () => {
        const content = contentLines.join('\n').trim();
        contentLines.length = 0;

        if (currentSubsection) {
            currentSubsection.content = content;
        } else if (currentSection) {
            currentSection.content = content;
        }
    };

    for (const line of lines) {
        // Level 1 header: # SECTION_NAME
        const l1Match = line.match(/^#\s+([A-Z][A-Z_\s&]*)\s*$/);
        if (l1Match) {
            flushContent();
            if (currentSubsection && currentSection) {
                currentSection.subsections.push(currentSubsection);
                currentSubsection = null;
            }
            if (currentSection) {
                sections.push(currentSection);
            }
            currentSection = {
                name: l1Match[1].trim(),
                isStandard: ['VISION', 'CONTEXT', 'STRUCTURE', 'PLAN', 'TASKS'].includes(l1Match[1].trim()),
                content: '',
                subsections: [],
                tasks: [],
                assets: [],
            };
            continue;
        }

        // Level 2 header: ## Subsection Name
        const l2Match = line.match(/^##\s+(.+)\s*$/);
        if (l2Match && currentSection) {
            flushContent();
            if (currentSubsection) {
                currentSection.subsections.push(currentSubsection);
            }
            currentSubsection = {
                name: l2Match[1].trim(),
                level: 2,
                content: '',
                subsections: [],
            };
            continue;
        }

        contentLines.push(line);
    }

    // Flush remaining
    flushContent();
    if (currentSubsection && currentSection) {
        currentSection.subsections.push(currentSubsection);
    }
    if (currentSection) {
        sections.push(currentSection);
    }

    return sections;
}
