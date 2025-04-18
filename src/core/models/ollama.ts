/**
 * Ollama Model Provider
 * 
 * Implementation of the model provider interface for local LLMs via Ollama
 */

import axios from 'axios';
import { BaseModelProvider, ModelMessage, CompletionOptions, EmbeddingOptions, ModelProviderInfo } from './base';

export class OllamaProvider extends BaseModelProvider {
  private baseUrl: string;
  
  constructor(baseUrl: string = 'http://localhost:11434') {
    // Use empty string for API key since Ollama doesn't use API keys
    const info: ModelProviderInfo = {
      name: 'Ollama',
      version: '1.0.0',
      defaultCompletionModel: 'llama3',
      defaultEmbeddingModel: 'llama3',
      capabilities: {
        streaming: true,
        functionCalling: false, // Native function calling not supported
        vision: false, // Depends on model but simplified for now
        embeddings: true
      },
      maxTokens: 32768 // This varies by model, using a common value
    };
    
    super('', info);
    this.baseUrl = baseUrl;
  }
  
  /**
   * Convert standard messages format to Ollama format
   * 
   * @param messages Messages in standard format
   * @returns Messages in Ollama format
   */
  private convertMessages(messages: ModelMessage[]): any[] {
    return messages.map(msg => {
      // Map our roles to Ollama roles
      let role = msg.role;
      if (msg.role === 'function' || msg.role === 'tool') {
        role = 'assistant'; // Map function responses to assistant
      }
      
      return {
        role,
        content: msg.content
      };
    });
  }
  
  /**
   * Generate a completion using Ollama models
   * 
   * @param messages Array of messages
   * @param options Completion options
   * @returns Generated completion text
   */
  async generateCompletion(messages: ModelMessage[], options?: CompletionOptions): Promise<string> {
    try {
      const modelName = options?.responseFormat?.model || this.info.defaultCompletionModel;
      const convertedMessages = this.convertMessages(messages);
      
      // The Ollama API returns responses in a streaming fashion
      // Each line of the response contains a JSON object with a token
      const response = await axios.post(`${this.baseUrl}/api/chat`, {
        model: modelName,
        messages: convertedMessages,
        temperature: options?.temperature,
        top_p: options?.topP,
        options: {
          num_predict: options?.maxTokens,
          stop: options?.stop
        }
      }, {
        // Set response type to text to get raw response
        responseType: 'text'
      });
      
      // The response is a multi-line string, each line is a JSON object
      // We need to parse each line and extract the content
      let fullContent = '';
      const lines = response.data.trim().split('\n');
      
      for (const line of lines) {
        try {
          const parsedLine = JSON.parse(line);
          if (parsedLine.message && parsedLine.message.content) {
            fullContent += parsedLine.message.content;
          }
        } catch (err) {
          console.warn('Error parsing Ollama response line:', err);
        }
      }
      
      return fullContent;
    } catch (error: any) {
      // Check if this is a model not found error
      if (error.response?.status === 404 && error.response?.data?.error?.includes('model') && error.response?.data?.error?.includes('not found')) {
        const modelName = options?.responseFormat?.model || this.info.defaultCompletionModel;
        throw new Error(`Ollama model "${modelName}" not found. Please install it using 'ollama pull ${modelName}' command.`);
      }
      
      // Check if this is a connection error
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Ollama server at ${this.baseUrl}. Make sure Ollama is running.`);
      }
      
      console.error('Error generating completion with Ollama:', error);
      throw new Error(`Ollama completion error: ${error}`);
    }
  }
  
  /**
   * Generate embeddings using Ollama models
   * 
   * @param text Text to generate embeddings for
   * @param options Embedding options
   * @returns Vector embeddings
   */
  async generateEmbeddings(text: string | string[], options?: EmbeddingOptions): Promise<number[] | number[][]> {
    try {
      const modelName = options?.model || this.info.defaultEmbeddingModel;
      
      if (Array.isArray(text)) {
        // Batch embedding generation
        const embeddings = await Promise.all(
          text.map(t => this.generateSingleEmbedding(t, modelName))
        );
        return embeddings;
      } else {
        // Single embedding generation
        return await this.generateSingleEmbedding(text, modelName);
      }
    } catch (error: any) {
      // Check if this is a model not found error
      if (error.response?.status === 404 && error.response?.data?.error?.includes('model') && error.response?.data?.error?.includes('not found')) {
        const modelName = options?.model || this.info.defaultEmbeddingModel;
        throw new Error(`Ollama model "${modelName}" not found. Please install it using 'ollama pull ${modelName}' command.`);
      }
      
      // Check if this is a connection error
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Ollama server at ${this.baseUrl}. Make sure Ollama is running.`);
      }
      
      console.error('Error generating embeddings with Ollama:', error);
      throw new Error(`Ollama embeddings error: ${error}`);
    }
  }
  
  /**
   * Generate a single embedding using Ollama
   * 
   * @param text Text to embed
   * @param model Model to use
   * @returns Vector embedding
   */
  private async generateSingleEmbedding(text: string, model: string): Promise<number[]> {
    const response = await axios.post(`${this.baseUrl}/api/embeddings`, {
      model,
      prompt: text
    });
    
    return response.data.embedding;
  }
}
