
/**
 * Model Factory
 * 
 * Factory for creating and configuring model providers based on environment variables
 */

import dotenv from 'dotenv';
import { ModelManager, createModelProvider } from './index';

// Variable to store environment variables if needed
// This is used as a fallback but most of the code uses process.env directly
let envVars: NodeJS.ProcessEnv;

// Override dotenv in Next.js environment
console.log('Initializing model providers...');
try {
  // In browser/server environment, we rely on .env.local being loaded by Next.js
  if (process.env.ANTHROPIC_API_KEY) {
    console.log('Found ANTHROPIC_API_KEY in environment');
    envVars = process.env;
  } else {
    // In Node.js direct execution, we use dotenv
    const result = dotenv.config({ path: '.env.local' });
    if (result.error) {
      console.warn('Error loading .env.local:', result.error);
    } else {
      console.log('.env.local loaded successfully');
    }
  }
} catch (error) {
  console.warn('Error loading environment variables:', error);
}

/**
 * Initialize model providers from environment variables
 * 
 * @returns Configured ModelManager
 */
export function initializeModelProviders(): ModelManager {
  const modelManager = new ModelManager();
  
  // Add a demo provider first - always available
  modelManager.addProvider(
    'demo',
    {
      generateCompletion: async (messages) => {
        // Simple echo for demonstration
        return `Demo response to: "${messages[messages.length - 1].content?.substring(0, 50)}..."\n\nThis is a demonstration provider. Please configure an API key in .env.local to use actual AI models.`;
      },
      generateEmbeddings: async () => {
        // Return dummy embeddings
        return new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
      },
      getInfo: () => ({
        name: 'Demo Provider',
        version: '1.0.0',
        defaultCompletionModel: 'demo-model',
        defaultEmbeddingModel: 'demo-embeddings',
        capabilities: {
          streaming: false,
          functionCalling: false,
          vision: false,
          embeddings: true
        },
        maxTokens: 1000
      })
    },
    false // Only set as default if explicitly requested
  );
  
  // Log the available environment variables for debugging
  console.log('Available API keys:', {
    'OpenAI': !!process.env.OPENAI_API_KEY,
    'Anthropic': !!process.env.ANTHROPIC_API_KEY,
    'Gemini': !!process.env.GEMINI_API_KEY,
    'Ollama': process.env.ENABLE_OLLAMA
  });
  
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
    
    // Add a demo provider so we have something to show in the UI
    modelManager.addProvider(
      'demo',
      {
        generateCompletion: async (messages) => {
          // Simple echo for demonstration
          return `Demo response to: "${messages[messages.length - 1].content?.substring(0, 50)}..."\n\nThis is a demonstration provider. Please configure an API key in .env.local to use actual AI models.`;
        },
        generateEmbeddings: async () => {
          // Return dummy embeddings
          return new Array(1536).fill(0).map(() => Math.random() * 2 - 1);
        },
        getInfo: () => ({
          name: 'Demo Provider',
          version: '1.0.0',
          defaultCompletionModel: 'demo-model',
          defaultEmbeddingModel: 'demo-embeddings',
          capabilities: {
            streaming: false,
            functionCalling: false,
            vision: false,
            embeddings: true
          },
          maxTokens: 1000
        })
      },
      true // Set as default
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
