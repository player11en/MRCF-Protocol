// ─────────────────────────────────────────────
// Provider Factory
// Developer 3 – AI Integration
// ─────────────────────────────────────────────

import { LLMProvider, ProviderConfig } from '../types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';

/**
 * Factory function to create an LLM provider instance.
 *
 * @example
 * ```ts
 * const provider = createProvider({
 *   provider: 'openai',
 *   apiKey: process.env.OPENAI_API_KEY!,
 *   model: 'gpt-4o',
 * });
 * ```
 */
export function createProvider(config: ProviderConfig): LLMProvider {
    switch (config.provider) {
        case 'openai':
            return new OpenAIProvider(config.apiKey, config.model, config.baseUrl);
        case 'anthropic':
            return new AnthropicProvider(config.apiKey, config.model, config.baseUrl);
        case 'google':
            return new GoogleProvider(config.apiKey, config.model, config.baseUrl);
        default:
            throw new Error(`Unknown provider: ${(config as ProviderConfig).provider}`);
    }
}

export { OpenAIProvider } from './openai';
export { AnthropicProvider } from './anthropic';
export { GoogleProvider } from './google';
