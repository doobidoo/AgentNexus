/**
 * Google Gemini Model Provider
 * 
 * Implementation of the model provider interface for Google's Gemini models
 */

import { GoogleGenerativeAI, GenerativeModel, EmbeddingModel } from '@google/generative-ai';
import { BaseModelProvider, ModelMessage, CompletionOptions, EmbeddingOptions, ModelProviderInfo } from './base';

export class GeminiProvider extends BaseModelProvider {
  private client: GoogleGenerativeAI;
  
  constructor(apiKey: string) {
    const info: ModelProviderInfo = {
      name: 'Google Gemini',
      version: '1.0.0',
      defaultCompletionModel: 'gemini-1.5-pro',
      defaultEmbeddingModel: 'embedding-001',
      capabilities: {
        streaming: true,
        functionCalling: true,
        vision: true,
        embeddings: true
      },
      maxTokens: 1048576 // Gemini 1.5 Pro (up to 1M tokens)
    };
    
    super(apiKey, info);
    this.client = new GoogleGenerativeAI(apiKey);
  }
  
  /**
   * Convert standard messages format to Gemini format
   * 
   * @param messages Messages in standard format
   * @returns Messages in Gemini format
   */
  private async convertMessages(messages: ModelMessage[]): Promise<any[]> {
    const geminiMessages: any[] = [];
    let systemPrompt = '';
    
    // Extract system message
    const systemMessage = messages.find(msg => msg.role === 'system');
    if (systemMessage) {
      systemPrompt = systemMessage.content;
    }
    
    // Convert the rest of the messages
    for (const msg of messages) {
      if (msg.role === 'system') continue; // Skip system messages
      
      if (msg.role === 'user') {
        geminiMessages.push({
          role: 'user',
          parts: [{ text: msg.content }]
        });
      } else if (msg.role === 'assistant') {
        geminiMessages.push({
          role: 'model',
          parts: [{ text: msg.content }]
        });
      } else if (msg.role === 'function' || msg.role === 'tool') {
        // Add function responses as user messages with special formatting
        geminiMessages.push({
          role: 'user',
          parts: [{ text: `[Function Response: ${msg.name}]\n${msg.content}` }]
        });
      }
    }
    
    // If there's a system prompt, add it to the first user message
    if (systemPrompt && geminiMessages.length > 0) {
      const firstUserIndex = geminiMessages.findIndex(msg => msg.role === 'user');
      if (firstUserIndex >= 0) {
        const firstUserMessage = geminiMessages[firstUserIndex];
        firstUserMessage.parts[0].text = `${systemPrompt}\n\n${firstUserMessage.parts[0].text}`;
      } else {
        // If no user message, add system prompt as a user message
        geminiMessages.unshift({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
      }
    }
    
    return geminiMessages;
  }
  
  /**
   * Generate a completion using Google Gemini models
   * 
   * @param messages Array of messages
   * @param options Completion options
   * @returns Generated completion text
   */
  async generateCompletion(messages: ModelMessage[], options?: CompletionOptions): Promise<string> {
    try {
      const modelName = options?.responseFormat?.model || this.info.defaultCompletionModel;
      const generationConfig = {
        temperature: options?.temperature,
        maxOutputTokens: options?.maxTokens,
        topP: options?.topP,
        stopSequences: options?.stop
      };
      
      // Initialize the model
      const model = this.client.getGenerativeModel({ model: modelName });
      
      // Convert messages to Gemini format
      const geminiMessages = await this.convertMessages(messages);
      
      // Add tools/functions if specified
      let toolConfig;
      if (options?.tools) {
        toolConfig = {
          tools: options.tools.map((tool: any) => ({
            functionDeclarations: [{
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters
            }]
          }))
        };
      }
      
      // Generate completion
      const result = await model.generateContent({
        contents: geminiMessages,
        generationConfig,
        ...(toolConfig && { tools: toolConfig })
      });
      
      // Extract and return the completion text
      return result.response.text();
    } catch (error) {
      console.error('Error generating completion with Gemini:', error);
      throw new Error(`Gemini completion error: ${error}`);
    }
  }
  
  /**
   * Generate embeddings using Google Gemini models
   * 
   * @param text Text to generate embeddings for
   * @param options Embedding options
   * @returns Vector embeddings
   */
  async generateEmbeddings(text: string | string[], options?: EmbeddingOptions): Promise<number[] | number[][]> {
    try {
      const modelName = options?.model || this.info.defaultEmbeddingModel;
      const embeddingModel = this.client.getEmbeddingModel({ model: modelName });
      
      if (Array.isArray(text)) {
        // Batch embedding generation
        const results = await Promise.all(
          text.map(t => embeddingModel.embedContent(t))
        );
        
        return results.map(result => result.embedding.values);
      } else {
        // Single embedding generation
        const result = await embeddingModel.embedContent(text);
        return result.embedding.values;
      }
    } catch (error) {
      console.error('Error generating embeddings with Gemini:', error);
      throw new Error(`Gemini embeddings error: ${error}`);
    }
  }
}
