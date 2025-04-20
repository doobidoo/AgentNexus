/**
 * Anthropic Model Provider
 * 
 * Implementation of the model provider interface for Anthropic Claude models
 */

import Anthropic from '@anthropic-ai/sdk';
import { BaseModelProvider, ModelMessage, CompletionOptions, EmbeddingOptions, ModelProviderInfo } from './base';

export class AnthropicProvider extends BaseModelProvider {
  private client: Anthropic;
  
  constructor(apiKey: string) {
    const info: ModelProviderInfo = {
      name: 'Anthropic',
      version: '1.0.0',
      defaultCompletionModel: 'claude-3-7-sonnet-20250219',
      defaultEmbeddingModel: '', // Anthropic doesn't offer embeddings API yet
      capabilities: {
        streaming: true,
        functionCalling: true,
        vision: true,
        embeddings: false
      },
      maxTokens: 200000 // Claude-3-7-Sonnet
    };
    
    super(apiKey, info);
    this.client = new Anthropic({ apiKey });
  }
  
  /**
   * Convert standard messages format to Anthropic format
   * 
   * @param messages Messages in standard format
   * @returns Messages in Anthropic format
   */
  private convertMessages(messages: ModelMessage[]): any[] {
    // Filter out 'function' role messages as they're not supported in the same way
    return messages
      .filter(msg => msg.role !== 'function')
      .map(msg => {
        // Convert 'system' role to system prompt for the first message
        if (msg.role === 'system') {
          return {
            role: 'user',
            content: msg.content
          };
        }
        
        // Map other roles directly
        return {
          role: msg.role,
          content: msg.content
        };
      });
  }
  
  /**
   * Extract system message from standard messages
   * 
   * @param messages Messages in standard format
   * @returns System message content or empty string
   */
  private extractSystemPrompt(messages: ModelMessage[]): string {
    const systemMessage = messages.find(msg => msg.role === 'system');
    return systemMessage?.content || '';
  }
  
  /**
   * Generate a completion using Anthropic Claude models
   * 
   * @param messages Array of messages
   * @param options Completion options
   * @returns Generated completion text
   */
  async generateCompletion(messages: ModelMessage[], options?: CompletionOptions): Promise<string> {
    try {
      // Extract system prompt and convert messages
      const systemPrompt = this.extractSystemPrompt(messages);
      const convertedMessages = this.convertMessages(messages.filter(msg => msg.role !== 'system'));
      
      // Check if we have a valid API key
      if (!this.apiKey || this.apiKey.trim() === '') {
        throw new Error('Anthropic API key is not configured');
      }
      
      // Determine which model to use (from responseFormat.model or default)
      const modelToUse = options?.responseFormat?.model || this.info.defaultCompletionModel;
      console.log(`[Anthropic] Generating completion with model: ${modelToUse}`);
      
      const completionOptions: any = {
        model: modelToUse,
        messages: convertedMessages,
        system: systemPrompt,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens || 1000, // Default to 1000 tokens if not specified
        top_p: options?.topP,
      };
      
      // Add tools if specified and convert to Anthropic format
      if (options?.tools) {
        completionOptions.tools = options.tools.map((tool: any) => ({
          name: tool.name,
          description: tool.description,
          input_schema: tool.parameters,
        }));
      }
      
      console.log('[Anthropic] Sending request to API...');
      const response = await this.client.messages.create(completionOptions);
      
      // Extract and return the completion text
      const result = response.content[0].text || '';
      console.log(`[Anthropic] Response received (${result.length} chars)`);
      return result;
    } catch (error: any) {
      console.error('[Anthropic] Error generating completion:', error);
      
      // Provide more specific error messages based on common error types
      if (error.status === 401 || error.status === 403) {
        throw new Error('Authentication failed with Anthropic API. Please check your API key.');
      } else if (error.status === 400) {
        if (error.error?.message?.includes('max_tokens')) {
          throw new Error('Invalid request: max_tokens parameter issue. Using default value of 1000.');
        } else {
          throw new Error(`Bad request to Anthropic API: ${error.error?.message || 'Unknown validation error'}`);
        }
      } else if (error.status === 429) {
        throw new Error('Anthropic API rate limit exceeded. Please try again later.');
      } else if (error.status === 500) {
        throw new Error('Anthropic API server error. Please try again later.');
      }
      
      throw new Error(`Anthropic API error: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Generate embeddings using Anthropic models
   * Not currently supported by Anthropic
   * 
   * @param text Text to generate embeddings for
   * @param options Embedding options
   * @returns Vector embeddings
   */
  async generateEmbeddings(text: string | string[], _options?: EmbeddingOptions): Promise<number[] | number[][]> {
    throw new Error('Embedding generation is not supported by Anthropic API');
  }
}
