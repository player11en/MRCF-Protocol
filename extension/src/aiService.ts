/**
 * AI service interface for the MRCF VS Code extension.
 */

import { createProvider, LLMProvider, RateLimitedProvider } from '@mrcf/ai';

export interface AiService {
  sendPrompt(context: string, userPrompt: string, presetId?: string): Promise<string>;
}

class MrcfAiService implements AiService {
  private provider: LLMProvider;

  constructor(apiKey: string, providerType: 'openai' | 'anthropic' | 'google' = 'openai') {
    // Wrap the raw provider in our rate limiter
    const rawProvider = createProvider({ provider: providerType, apiKey });
    this.provider = new RateLimitedProvider(rawProvider);
  }

  async sendPrompt(context: string, userPrompt: string, presetId?: string): Promise<string> {
    const systemPrompt = presetId
      ? `You are a helpful AI assistant for the MRCF document format. Context mode: ${presetId}`
      : `You are a helpful AI assistant for the MRCF document format.`;

    const fullPrompt = `${userPrompt}\n\n---\nDocument Context:\n${context}`;

    const response = await this.provider.sendPrompt(fullPrompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 2048,
    });

    return response.content;
  }
}

class MockAiService implements AiService {
  async sendPrompt(context: string, userPrompt: string, presetId?: string): Promise<string> {
    const header = presetId ? `Preset: ${presetId}\n\n` : '';
    return `${header}Echoed prompt:\n${userPrompt}\n\n---\nContext snippet:\n${context.slice(0, 500)}`;
  }
}

// Start with mock, let activate() inject the real one if API key is configured
let currentService: AiService = new MockAiService();

export function getAiService(): AiService {
  return currentService;
}

export function setAiService(service: AiService): void {
  currentService = service;
}

// Helper to initialize the real service from extension configuration
export function initializeAiService(apiKey: string, provider: 'openai' | 'anthropic' | 'google' = 'openai'): void {
  if (apiKey) {
    setAiService(new MrcfAiService(apiKey, provider));
  }
}

