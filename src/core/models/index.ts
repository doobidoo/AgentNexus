/**
 * Model Providers Module
 * 
 * Unified interface for working with different AI model providers
 */

import { ModelProvider, ModelMessage, CompletionOptions, EmbeddingOptions } from './base';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { OllamaProvider } from './ollama';

// Export all model provider types
export * from './base';
export * from './openai';
export * from './anthropic';
export * from './gemini';
export * from './ollama';

/**
 * Supported model provider types
 */
export type ModelProviderType = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'custom';

/**
 * Configuration for creating a model provider instance
 */
export interface ModelProviderConfig {
  type: ModelProviderType;
  apiKey?: string;
  baseUrl?: string;
  custom?: ModelProvider;
}

/**
 * Create a model provider instance based on configuration
 * 
 * @param config Configuration for the model provider
 * @returns ModelProvider instance
 */
export function createModelProvider(config: ModelProviderConfig): ModelProvider {
  switch (config.type) {
    case 'openai':
      if (!config.apiKey) throw new Error('API key is required for OpenAI');
      return new OpenAIProvider(config.apiKey);
    
    case 'anthropic':
      if (!config.apiKey) throw new Error('API key is required for Anthropic');
      return new AnthropicProvider(config.apiKey);
    
    case 'gemini':
      if (!config.apiKey) throw new Error('API key is required for Gemini');
      return new GeminiProvider(config.apiKey);
    
    case 'ollama':
      return new OllamaProvider(config.baseUrl);
    
    case 'custom':
      if (!config.custom) throw new Error('Custom model provider instance is required');
      return config.custom;
    
    default:
      throw new Error(`Unsupported model provider type: ${config.type}`);
  }
}

/**
 * Model Manager class for handling multiple model providers
 */
export class ModelManager {
  private providers: Map<string, ModelProvider> = new Map();
  private defaultProvider: string | null = null;
  
  /**
   * Add a model provider
   * 
   * @param name Name to identify the provider
   * @param provider ModelProvider instance
   * @param setAsDefault Whether to set this as the default provider
   */
  addProvider(name: string, provider: ModelProvider, setAsDefault: boolean = false): void {
    this.providers.set(name, provider);
    
    if (setAsDefault || this.defaultProvider === null) {
      this.defaultProvider = name;
    }
  }
  
  /**
   * Get a specific model provider
   * 
   * @param name Name of the provider
   * @returns ModelProvider instance
   */
  getProvider(name?: string): ModelProvider {
    const providerName = name || this.defaultProvider;
    
    if (!providerName) {
      throw new Error('No default provider set and no provider name specified');
    }
    
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }
    
    return provider;
  }
  
  /**
   * Set the default provider
   * 
   * @param name Name of the provider to set as default
   */
  setDefaultProvider(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Cannot set default provider: ${name} not found`);
    }
    
    this.defaultProvider = name;
  }
  
  /**
   * List all available providers
   * 
   * @returns Array of provider names
   */
  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
  
  /**
   * Generate a completion using the specified or default provider
   * 
   * @param messages Array of messages
   * @param options Completion options
   * @param providerName Optional name of the provider to use
   * @returns Generated completion text
   */
  async generateCompletion(
    messages: ModelMessage[],
    options?: CompletionOptions,
    providerName?: string
  ): Promise<string> {
    const provider = this.getProvider(providerName);
    return provider.generateCompletion(messages, options);
  }
  
  /**
   * Generate embeddings using the specified or default provider
   * 
   * @param text Text to generate embeddings for
   * @param options Embedding options
   * @param providerName Optional name of the provider to use
   * @returns Vector embeddings
   */
  async generateEmbeddings(
    text: string | string[],
    options?: EmbeddingOptions,
    providerName?: string
  ): Promise<number[] | number[][]> {
    const provider = this.getProvider(providerName);
    return provider.generateEmbeddings(text, options);
  }
}
