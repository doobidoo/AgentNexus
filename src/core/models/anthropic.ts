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
      
      const completionOptions: any = {
        model: options?.responseFormat?.model || this.info.defaultCompletionModel,
        messages: convertedMessages,
        system: systemPrompt,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
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
      
      const response = await this.client.messages.create(completionOptions);
      
      // Extract and return the completion text
      return response.content[0].text || '';
    } catch (error) {
      console.error('Error generating completion with Anthropic:', error);
      throw new Error(`Anthropic completion error: ${error}`);
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
  async generateEmbeddings(text: string | string[], options?: EmbeddingOptions): Promise<number[] | number[][]> {
    throw new Error('Embedding generation is not supported by Anthropic API');
  }
}
