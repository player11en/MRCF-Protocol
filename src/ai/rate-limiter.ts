// ─────────────────────────────────────────────
// Rate Limiter with Exponential Backoff
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { LLMProvider, LLMRequestOptions, LLMResponse, RateLimiterConfig } from './types';

const DEFAULT_CONFIG: RateLimiterConfig = {
    maxRequestsPerMinute: 60,
    retryAttempts: 3,
    retryDelayMs: 1000,
};

/**
 * Wraps an LLMProvider with rate limiting and automatic retry.
 * Uses a token-bucket approach for rate limiting and exponential
 * backoff for retries.
 */
export class RateLimitedProvider implements LLMProvider {
    readonly name: string;
    private readonly provider: LLMProvider;
    private readonly config: RateLimiterConfig;
    private readonly requestTimestamps: number[] = [];

    constructor(provider: LLMProvider, config?: Partial<RateLimiterConfig>) {
        this.provider = provider;
        this.name = `rate-limited:${provider.name}`;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    async sendPrompt(
        prompt: string,
        options?: LLMRequestOptions
    ): Promise<LLMResponse> {
        await this.waitForSlot();

        let lastError: Error | undefined;

        for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
            try {
                this.recordRequest();
                return await this.provider.sendPrompt(prompt, options);
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));

                // Don't retry on non-retryable errors
                if (this.isNonRetryable(lastError)) {
                    throw lastError;
                }

                if (attempt < this.config.retryAttempts) {
                    const delay = this.config.retryDelayMs * Math.pow(2, attempt);
                    await this.sleep(delay);
                }
            }
        }

        throw lastError ?? new Error('Rate limiter: max retries exceeded');
    }

    /**
     * Wait until a rate-limit slot is available.
     */
    private async waitForSlot(): Promise<void> {
        const now = Date.now();
        const windowStart = now - 60_000;

        // Clean old timestamps
        while (
            this.requestTimestamps.length > 0 &&
            this.requestTimestamps[0] < windowStart
        ) {
            this.requestTimestamps.shift();
        }

        if (this.requestTimestamps.length >= this.config.maxRequestsPerMinute) {
            const oldestInWindow = this.requestTimestamps[0];
            const waitMs = oldestInWindow + 60_000 - now + 100; // +100ms buffer
            if (waitMs > 0) {
                await this.sleep(waitMs);
            }
        }
    }

    private recordRequest(): void {
        this.requestTimestamps.push(Date.now());
    }

    /**
     * Check if an error is non-retryable (e.g. auth errors).
     */
    private isNonRetryable(error: Error): boolean {
        const message = error.message.toLowerCase();
        return (
            message.includes('401') ||
            message.includes('403') ||
            message.includes('invalid api key') ||
            message.includes('authentication')
        );
    }

    private sleep(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
