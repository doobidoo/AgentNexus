/**
 * OpenAI Model Provider
 * 
 * Implementation of the model provider interface for OpenAI models
 */

import OpenAI from 'openai';
import { BaseModelProvider, ModelMessage, CompletionOptions, EmbeddingOptions, ModelProviderInfo } from './base';

export class OpenAIProvider extends BaseModelProvider {
  private client: OpenAI;
  
  constructor(apiKey: string) {
    const info: ModelProviderInfo = {
      name: 'OpenAI',
      version: '1.0.0',
      defaultCompletionModel: 'gpt-4o',
      defaultEmbeddingModel: 'text-embedding-3-large',
      capabilities: {
        streaming: true,
        functionCalling: true,
        vision: true,
        embeddings: true
      },
      maxTokens: 128000 // For gpt-4o
    };
    
    super(apiKey, info);
    this.client = new OpenAI({ apiKey });
  }
  
  /**
   * Generate a completion using OpenAI models
   * 
   * @param messages Array of messages
   * @param options Completion options
   * @returns Generated completion text
   */
  async generateCompletion(messages: ModelMessage[], options?: CompletionOptions): Promise<string> {
    try {
      const completionOptions: any = {
        model: options?.responseFormat?.model || this.info.defaultCompletionModel,
        messages: messages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
        top_p: options?.topP,
        frequency_penalty: options?.frequencyPenalty,
        presence_penalty: options?.presencePenalty,
        stop: options?.stop,
      };
      
      // Add tools if specified
      if (options?.tools) {
        completionOptions.tools = options.tools;
      }
      
      // Add response format if specified
      if (options?.responseFormat) {
        completionOptions.response_format = options.responseFormat;
      }
      
      const response = await this.client.chat.completions.create(completionOptions);
      
      // Extract and return the completion text
      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Error generating completion with OpenAI:', error);
      throw new Error(`OpenAI completion error: ${error}`);
    }
  }
  
  /**
   * Generate embeddings using OpenAI models
   * 
   * @param text Text to generate embeddings for
   * @param options Embedding options
   * @returns Vector embeddings
   */
  async generateEmbeddings(text: string | string[], options?: EmbeddingOptions): Promise<number[] | number[][]> {
    try {
      const input = Array.isArray(text) ? text : [text];
      
      const response = await this.client.embeddings.create({
        model: options?.model || this.info.defaultEmbeddingModel,
        input,
        dimensions: options?.dimensions
      });
      
      // Extract and return the embeddings
      const embeddings = response.data.map(item => item.embedding);
      
      // If the input was a single string, return a single embedding
      return Array.isArray(text) ? embeddings : embeddings[0];
    } catch (error) {
      console.error('Error generating embeddings with OpenAI:', error);
      throw new Error(`OpenAI embeddings error: ${error}`);
    }
  }
}
