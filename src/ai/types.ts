// ─────────────────────────────────────────────
// @mrcf/ai – Core Type Definitions
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

/**
 * Standardized response from any LLM provider.
 */
export interface LLMResponse {
    content: string;
    model: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}

/**
 * Options passed to an LLM provider call.
 */
export interface LLMRequestOptions {
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}

/**
 * Provider-agnostic adapter interface.
 * Each LLM provider (OpenAI, Anthropic, Google) implements this.
 */
export interface LLMProvider {
    readonly name: string;
    sendPrompt(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse>;
}

/**
 * Configuration for creating an LLM provider.
 */
export interface ProviderConfig {
    provider: 'openai' | 'anthropic' | 'google';
    apiKey: string;
    model?: string;
    baseUrl?: string;
}

/**
 * Prompt template definition.
 */
export interface PromptTemplate {
    name: string;
    description: string;
    systemPrompt: string;
    userPromptTemplate: string;
}

/**
 * Rate limiter configuration.
 */
export interface RateLimiterConfig {
    maxRequestsPerMinute: number;
    retryAttempts: number;
    retryDelayMs: number;
}

// ─────────────────────────────────────────────
// Document Model types (shared with Dev 1)
// Re-exported from @mrcf/parser
// ─────────────────────────────────────────────

export type {
    MrcfDocument as MrcfDocument,
    MrcfSection as MrcfSection,
    MrcfMetadata as MrcfMetadata
} from '@mrcf/parser';

// ─────────────────────────────────────────────
// Analysis & Generation result types
// ─────────────────────────────────────────────

export interface AnalysisWarning {
    section: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
}

export interface AnalysisSuggestion {
    section: string;
    suggestion: string;
    generatedContent?: string;
}

export interface AnalysisResult {
    warnings: AnalysisWarning[];
    suggestions: AnalysisSuggestion[];
}

export interface GenerationResult {
    sectionName: string;
    content: string;
    model: string;
    tokensUsed: number;
}

// ─────────────────────────────────────────────
// Diff & Safety types
// ─────────────────────────────────────────────

export type DiffLineType = 'added' | 'removed' | 'unchanged';

export interface DiffLine {
    type: DiffLineType;
    content: string;
    lineNumber?: number;
}

export interface SectionDiff {
    sectionName: string;
    original: string;
    proposed: string;
    lines: DiffLine[];
}

export type ChangeStatus = 'pending' | 'accepted' | 'rejected';

export interface PendingChange {
    id: string;
    sectionName: string;
    diff: SectionDiff;
    status: ChangeStatus;
    timestamp: string;
}

export interface SectionVersion {
    version: number;
    content: string;
    timestamp: string;
    source: 'human' | 'ai';
    changeId?: string;
}
