// ─────────────────────────────────────────────
// Google Gemini Provider Adapter
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { LLMProvider, LLMRequestOptions, LLMResponse } from '../types';

const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export class GoogleProvider implements LLMProvider {
    readonly name = 'google';
    private readonly apiKey: string;
    private readonly model: string;
    private readonly baseUrl: string;

    constructor(apiKey: string, model?: string, baseUrl?: string) {
        if (!apiKey) throw new Error('Google API key is required');
        this.apiKey = apiKey;
        this.model = model ?? DEFAULT_MODEL;
        this.baseUrl = baseUrl ?? DEFAULT_BASE_URL;
    }

    async sendPrompt(
        prompt: string,
        options?: LLMRequestOptions
    ): Promise<LLMResponse> {
        const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

        if (options?.systemPrompt) {
            contents.push({
                role: 'user',
                parts: [{ text: options.systemPrompt }],
            });
            contents.push({
                role: 'model',
                parts: [{ text: 'Understood. I will follow these instructions.' }],
            });
        }

        contents.push({
            role: 'user',
            parts: [{ text: prompt }],
        });

        const body: Record<string, unknown> = { contents };

        if (options?.temperature !== undefined || options?.maxTokens) {
            body.generationConfig = {
                ...(options.temperature !== undefined && {
                    temperature: options.temperature,
                }),
                ...(options.maxTokens && { maxOutputTokens: options.maxTokens }),
            };
        }

        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(
                `Google API error (${response.status}): ${errorBody}`
            );
        }

        const data: any = await response.json();
        const candidate = data.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('Google returned an empty response');
        }

        return {
            content: text,
            model: this.model,
            usage: {
                promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
                completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
                totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
            },
        };
    }
}
