/**
 * Base Model Provider Interface
 * 
 * Defines the standard interface for AI model providers in Agent Nexus.
 * This abstraction allows the architecture to work with different AI models
 * including OpenAI, Anthropic, Google (Gemini), DeepSeek, local LLMs via OLLAMA, etc.
 */

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant' | 'function' | 'tool';
  content: string;
  name?: string;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  tools?: any[];
  responseFormat?: any;
}

export interface EmbeddingOptions {
  model?: string;
  dimensions?: number;
}

export interface ModelProvider {
  /**
   * Generate a completion from the model
   * 
   * @param messages Array of messages
   * @param options Completion options
   * @returns Generated completion text
   */
  generateCompletion(messages: ModelMessage[], options?: CompletionOptions): Promise<string>;
  
  /**
   * Generate embeddings for text
   * 
   * @param text Text to generate embeddings for
   * @param options Embedding options
   * @returns Vector embeddings
   */
  generateEmbeddings(text: string | string[], options?: EmbeddingOptions): Promise<number[] | number[][]>;
  
  /**
   * Get information about the model provider
   * 
   * @returns Information about the model provider
   */
  getInfo(): ModelProviderInfo;
}

export interface ModelProviderInfo {
  name: string;
  version: string;
  defaultCompletionModel: string;
  defaultEmbeddingModel: string;
  capabilities: {
    streaming: boolean;
    functionCalling: boolean;
    vision: boolean;
    embeddings: boolean;
  };
  maxTokens: number;
}

/**
 * Abstract base class for model providers
 */
export abstract class BaseModelProvider implements ModelProvider {
  protected apiKey: string;
  protected info: ModelProviderInfo;
  
  constructor(apiKey: string, info: ModelProviderInfo) {
    this.apiKey = apiKey;
    this.info = info;
  }
  
  abstract generateCompletion(messages: ModelMessage[], options?: CompletionOptions): Promise<string>;
  
  abstract generateEmbeddings(text: string | string[], options?: EmbeddingOptions): Promise<number[] | number[][]>;
  
  getInfo(): ModelProviderInfo {
    return { ...this.info };
  }
}
