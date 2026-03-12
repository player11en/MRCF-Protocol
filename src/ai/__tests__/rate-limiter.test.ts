// ─────────────────────────────────────────────
// Unit Tests: Rate Limiter
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { RateLimitedProvider } from '../rate-limiter';
import { LLMProvider, LLMResponse, LLMRequestOptions } from '../types';

class MockProvider implements LLMProvider {
    name = 'mock';
    callCount = 0;
    shouldFail = false;
    failMessage = 'Mock error';

    async sendPrompt(prompt: string, options?: LLMRequestOptions): Promise<LLMResponse> {
        this.callCount++;
        if (this.shouldFail) {
            throw new Error(this.failMessage);
        }
        return {
            content: `Response to: ${prompt}`,
            model: 'mock-model',
            usage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
        };
    }
}

describe('RateLimitedProvider', () => {
    it('passes through to underlying provider', async () => {
        const mock = new MockProvider();
        const limited = new RateLimitedProvider(mock);

        const result = await limited.sendPrompt('Hello');
        expect(result.content).toBe('Response to: Hello');
        expect(mock.callCount).toBe(1);
    });

    it('has descriptive name', () => {
        const mock = new MockProvider();
        const limited = new RateLimitedProvider(mock);
        expect(limited.name).toBe('rate-limited:mock');
    });

    it('retries on transient errors', async () => {
        const mock = new MockProvider();
        let attempts = 0;

        mock.sendPrompt = async () => {
            attempts++;
            if (attempts < 3) throw new Error('Server error 500');
            return {
                content: 'Finally!',
                model: 'mock',
                usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
            };
        };

        const limited = new RateLimitedProvider(mock, {
            retryAttempts: 3,
            retryDelayMs: 10, // Fast for testing
            maxRequestsPerMinute: 100,
        });

        const result = await limited.sendPrompt('Test');
        expect(result.content).toBe('Finally!');
        expect(attempts).toBe(3);
    });

    it('does NOT retry on auth errors', async () => {
        const mock = new MockProvider();
        mock.shouldFail = true;
        mock.failMessage = 'OpenAI API error (401): Invalid API key';

        const limited = new RateLimitedProvider(mock, {
            retryAttempts: 3,
            retryDelayMs: 10,
            maxRequestsPerMinute: 100,
        });

        await expect(limited.sendPrompt('Test')).rejects.toThrow('401');
        expect(mock.callCount).toBe(1); // only tried once
    });

    it('throws after exhausting retries', async () => {
        const mock = new MockProvider();
        mock.shouldFail = true;
        mock.failMessage = 'Server error 500';

        const limited = new RateLimitedProvider(mock, {
            retryAttempts: 2,
            retryDelayMs: 10,
            maxRequestsPerMinute: 100,
        });

        await expect(limited.sendPrompt('Test')).rejects.toThrow('500');
        expect(mock.callCount).toBe(3); // 1 initial + 2 retries
    });
});
