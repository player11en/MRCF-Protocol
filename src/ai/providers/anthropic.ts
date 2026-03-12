// ─────────────────────────────────────────────
// Anthropic Provider Adapter
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { LLMProvider, LLMRequestOptions, LLMResponse } from '../types';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_BASE_URL = 'https://api.anthropic.com/v1';
const API_VERSION = '2023-06-01';

export class AnthropicProvider implements LLMProvider {
    readonly name = 'anthropic';
    private readonly apiKey: string;
    private readonly model: string;
    private readonly baseUrl: string;

    constructor(apiKey: string, model?: string, baseUrl?: string) {
        if (!apiKey) throw new Error('Anthropic API key is required');
        this.apiKey = apiKey;
        this.model = model ?? DEFAULT_MODEL;
        this.baseUrl = baseUrl ?? DEFAULT_BASE_URL;
    }

    async sendPrompt(
        prompt: string,
        options?: LLMRequestOptions
    ): Promise<LLMResponse> {
        const body: Record<string, unknown> = {
            model: this.model,
            max_tokens: options?.maxTokens ?? 2048,
            messages: [{ role: 'user', content: prompt }],
        };

        if (options?.systemPrompt) {
            body.system = options.systemPrompt;
        }
        if (options?.temperature !== undefined) {
            body.temperature = options.temperature;
        }

        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'anthropic-version': API_VERSION,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Anthropic API error (${response.status}): ${errorBody}`
            );
        }

        const data: any = await response.json();
        const textBlock = data.content?.find(
            (block: { type: string }) => block.type === 'text'
        );

        if (!textBlock?.text) {
            throw new Error('Anthropic returned an empty response');
        }

        return {
            content: textBlock.text,
            model: data.model ?? this.model,
            usage: {
                promptTokens: data.usage?.input_tokens ?? 0,
                completionTokens: data.usage?.output_tokens ?? 0,
                totalTokens:
                    (data.usage?.input_tokens ?? 0) +
                    (data.usage?.output_tokens ?? 0),
            },
        };
    }
}
