// ─────────────────────────────────────────────
// Unit Tests: Provider Adapters & Factory
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { createProvider } from '../providers';
import { OpenAIProvider } from '../providers/openai';
import { AnthropicProvider } from '../providers/anthropic';
import { GoogleProvider } from '../providers/google';

// ── Mock fetch globally ──────────────────────
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

afterEach(() => {
    mockFetch.mockReset();
});

// ─────────────────────────────────────────────
// Factory Tests
// ─────────────────────────────────────────────

describe('createProvider', () => {
    it('creates an OpenAI provider', () => {
        const provider = createProvider({ provider: 'openai', apiKey: 'test-key' });
        expect(provider.name).toBe('openai');
        expect(provider).toBeInstanceOf(OpenAIProvider);
    });

    it('creates an Anthropic provider', () => {
        const provider = createProvider({ provider: 'anthropic', apiKey: 'test-key' });
        expect(provider.name).toBe('anthropic');
        expect(provider).toBeInstanceOf(AnthropicProvider);
    });

    it('creates a Google provider', () => {
        const provider = createProvider({ provider: 'google', apiKey: 'test-key' });
        expect(provider.name).toBe('google');
        expect(provider).toBeInstanceOf(GoogleProvider);
    });

    it('throws on unknown provider', () => {
        expect(() =>
            createProvider({ provider: 'unknown' as any, apiKey: 'key' })
        ).toThrow('Unknown provider');
    });
});

// ─────────────────────────────────────────────
// OpenAI Provider Tests
// ─────────────────────────────────────────────

describe('OpenAIProvider', () => {
    it('throws if no API key provided', () => {
        expect(() => new OpenAIProvider('')).toThrow('API key is required');
    });

    it('sends a prompt and returns structured response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: 'Hello from GPT' } }],
                model: 'gpt-4o',
                usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
            }),
        });

        const provider = new OpenAIProvider('test-key');
        const result = await provider.sendPrompt('Hi');

        expect(result.content).toBe('Hello from GPT');
        expect(result.model).toBe('gpt-4o');
        expect(result.usage.totalTokens).toBe(15);

        // Verify fetch was called with correct headers
        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.openai.com/v1/chat/completions',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-key',
                }),
            })
        );
    });

    it('includes system prompt in messages', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                choices: [{ message: { content: 'Response' } }],
                model: 'gpt-4o',
                usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
            }),
        });

        const provider = new OpenAIProvider('test-key');
        await provider.sendPrompt('Hi', { systemPrompt: 'You are helpful' });

        const body = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(body.messages[0]).toEqual({ role: 'system', content: 'You are helpful' });
        expect(body.messages[1]).toEqual({ role: 'user', content: 'Hi' });
    });

    it('throws on API error', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 429,
            text: async () => 'Rate limit exceeded',
        });

        const provider = new OpenAIProvider('test-key');
        await expect(provider.sendPrompt('Hi')).rejects.toThrow('OpenAI API error (429)');
    });

    it('throws on empty response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ choices: [] }),
        });

        const provider = new OpenAIProvider('test-key');
        await expect(provider.sendPrompt('Hi')).rejects.toThrow('empty response');
    });
});

// ─────────────────────────────────────────────
// Anthropic Provider Tests
// ─────────────────────────────────────────────

describe('AnthropicProvider', () => {
    it('sends a prompt and returns structured response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                content: [{ type: 'text', text: 'Hello from Claude' }],
                model: 'claude-sonnet-4-20250514',
                usage: { input_tokens: 12, output_tokens: 8 },
            }),
        });

        const provider = new AnthropicProvider('test-key');
        const result = await provider.sendPrompt('Hi');

        expect(result.content).toBe('Hello from Claude');
        expect(result.usage.promptTokens).toBe(12);
        expect(result.usage.completionTokens).toBe(8);
        expect(result.usage.totalTokens).toBe(20);
    });

    it('sends anthropic-version header', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                content: [{ type: 'text', text: 'ok' }],
                usage: { input_tokens: 1, output_tokens: 1 },
            }),
        });

        const provider = new AnthropicProvider('test-key');
        await provider.sendPrompt('Hi');

        expect(mockFetch).toHaveBeenCalledWith(
            'https://api.anthropic.com/v1/messages',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'x-api-key': 'test-key',
                    'anthropic-version': '2023-06-01',
                }),
            })
        );
    });
});

// ─────────────────────────────────────────────
// Google Provider Tests
// ─────────────────────────────────────────────

describe('GoogleProvider', () => {
    it('sends a prompt and returns structured response', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: 'Hello from Gemini' }] } }],
                usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 10, totalTokenCount: 15 },
            }),
        });

        const provider = new GoogleProvider('test-key');
        const result = await provider.sendPrompt('Hi');

        expect(result.content).toBe('Hello from Gemini');
        expect(result.usage.totalTokens).toBe(15);
    });

    it('includes API key in URL', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: 'ok' }] } }],
                usageMetadata: {},
            }),
        });

        const provider = new GoogleProvider('my-key');
        await provider.sendPrompt('Hi');

        expect(mockFetch.mock.calls[0][0]).toContain('key=my-key');
    });
});
