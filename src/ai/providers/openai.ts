// ─────────────────────────────────────────────
// OpenAI Provider Adapter
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { LLMProvider, LLMRequestOptions, LLMResponse } from '../types';

const DEFAULT_MODEL = 'gpt-4o';
const DEFAULT_BASE_URL = 'https://api.openai.com/v1';

export class OpenAIProvider implements LLMProvider {
    readonly name = 'openai';
    private readonly apiKey: string;
    private readonly model: string;
    private readonly baseUrl: string;

    constructor(apiKey: string, model?: string, baseUrl?: string) {
        if (!apiKey) throw new Error('OpenAI API key is required');
        this.apiKey = apiKey;
        this.model = model ?? DEFAULT_MODEL;
        this.baseUrl = baseUrl ?? DEFAULT_BASE_URL;
    }

    async sendPrompt(
        prompt: string,
        options?: LLMRequestOptions
    ): Promise<LLMResponse> {
        const messages: Array<{ role: string; content: string }> = [];

        if (options?.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const body = {
            model: this.model,
            messages,
            temperature: options?.temperature ?? 0.7,
            max_tokens: options?.maxTokens ?? 2048,
        };

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `OpenAI API error (${response.status}): ${errorBody}`
            );
        }

        const data: any = await response.json();
        const choice = data.choices?.[0];

        if (!choice?.message?.content) {
            throw new Error('OpenAI returned an empty response');
        }

        return {
            content: choice.message.content,
            model: data.model ?? this.model,
            usage: {
                promptTokens: data.usage?.prompt_tokens ?? 0,
                completionTokens: data.usage?.completion_tokens ?? 0,
                totalTokens: data.usage?.total_tokens ?? 0,
            },
        };
    }
}
