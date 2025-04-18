/**
 * Model Factory
 * 
 * Factory for creating and configuring model providers based on environment variables
 */

import dotenv from 'dotenv';
import { ModelManager, createModelProvider, ModelProviderType } from './index';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

/**
 * Initialize model providers from environment variables
 * 
 * @returns Configured ModelManager
 */
export function initializeModelProviders(): ModelManager {
  const modelManager = new ModelManager();
  
  // Get the default provider type from environment
  const defaultProviderType = process.env.DEFAULT_MODEL_PROVIDER || 'openai';
  
  // Initialize OpenAI if API key is available
  if (process.env.OPENAI_API_KEY) {
    modelManager.addProvider(
      'openai',
      createModelProvider({
        type: 'openai',
        apiKey: process.env.OPENAI_API_KEY
      }),
      defaultProviderType === 'openai'
    );
  }
  
  // Initialize Anthropic if API key is available
  if (process.env.ANTHROPIC_API_KEY) {
    modelManager.addProvider(
      'anthropic',
      createModelProvider({
        type: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY
      }),
      defaultProviderType === 'anthropic'
    );
  }
  
  // Initialize Gemini if API key is available
  if (process.env.GEMINI_API_KEY) {
    modelManager.addProvider(
      'gemini',
      createModelProvider({
        type: 'gemini',
        apiKey: process.env.GEMINI_API_KEY
      }),
      defaultProviderType === 'gemini'
    );
  }
  
  // Initialize Ollama if enabled
  if (process.env.ENABLE_OLLAMA === 'true') {
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    
    modelManager.addProvider(
      'ollama',
      createModelProvider({
        type: 'ollama',
        baseUrl: ollamaBaseUrl
      }),
      defaultProviderType === 'ollama'
    );
  }
  
  // Check if we have any providers
  if (modelManager.listProviders().length === 0) {
    console.warn('No model providers configured. Please set API keys in .env.local');
    
    // Add a fallback provider that throws an error when used
    modelManager.addProvider(
      'fallback',
      {
        generateCompletion: async () => {
          throw new Error('No model providers configured. Please set API keys in .env.local');
        },
        generateEmbeddings: async () => {
          throw new Error('No model providers configured. Please set API keys in .env.local');
        },
        getInfo: () => ({
          name: 'Fallback',
          version: '1.0.0',
          defaultCompletionModel: 'none',
          defaultEmbeddingModel: 'none',
          capabilities: {
            streaming: false,
            functionCalling: false,
            vision: false,
            embeddings: false
          },
          maxTokens: 0
        })
      },
      true
    );
  }
  
  return modelManager;
}

// Export a singleton instance
export const modelManager = initializeModelProviders();

/**
 * Get a pre-configured model provider
 * 
 * @param name Optional name of the provider
 * @returns ModelProvider instance
 */
export function getModelProvider(name?: string) {
  return modelManager.getProvider(name);
}
