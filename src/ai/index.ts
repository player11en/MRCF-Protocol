// ─────────────────────────────────────────────
// @mrcf/ai – Main Entry Point
// Developer 3 – AI Integration
//
// This module provides the complete AI integration layer
// for the MRCF document format.
// ─────────────────────────────────────────────

// ── Types ────────────────────────────────────
export type {
    LLMProvider,
    LLMResponse,
    LLMRequestOptions,
    ProviderConfig,
    PromptTemplate,
    RateLimiterConfig,
    MrcfDocument,
    MrcfSection,
    MrcfMetadata,
    AnalysisResult,
    AnalysisWarning,
    AnalysisSuggestion,
    GenerationResult,
    DiffLine,
    DiffLineType,
    SectionDiff,
    PendingChange,
    ChangeStatus,
    SectionVersion,
} from './types';

// ── Providers ────────────────────────────────
export { createProvider, OpenAIProvider, AnthropicProvider, GoogleProvider } from './providers';

// ── Prompt Templates ─────────────────────────
export { TEMPLATES, renderTemplate } from './prompt-templates';

// ── Response Parser ──────────────────────────
export {
    parseJsonResponse,
    parseAnalysisResponse,
    parseConsistencyResponse,
    parseSectionContent,
    extractSections,
} from './response-parser';

// ── Rate Limiter ─────────────────────────────
export { RateLimitedProvider } from './rate-limiter';

// ── Analysis ─────────────────────────────────
export {
    buildContext,
    getSection,
    getSectionText,
    extractMetadata,
    parseMrcfDocument,
    listPresentSections,
    analyzeDocument,
    checkConsistency,
} from './analysis';

// ── Generation ───────────────────────────────
export {
    generatePlan,
    generateTasks,
    injectSection,
    serializeDocument,
} from './generation';
export type { InjectionMode } from './generation';

// ── Diff & Safety ────────────────────────────
export {
    computeDiff,
    hasChanges,
    summarizeDiff,
    formatDiff,
    ChangeManager,
    VersionTracker,
} from './diff';
