/**
 * Model Providers Test Script
 * 
 * A utility script to test different model providers in the Agent Nexus framework
 */

import { modelManager } from '../src/core/models/factory';

// List of test prompts
const TEST_PROMPTS = [
  "Explain the concept of artificial intelligence in one paragraph.",
  "Write a short poem about nature.",
  "What are three benefits of exercise?"
];

/**
 * Test a specific model provider with various prompts
 * 
 * @param providerName Name of the provider to test
 */
async function testProvider(providerName: string) {
  console.log(`\n===== Testing ${providerName} Provider =====`);
  
  try {
    // Get the provider
    const provider = modelManager.getProvider(providerName);
    
    // Get provider info
    const info = provider.getInfo();
    console.log(`Provider: ${info.name}`);
    console.log(`Default model: ${info.defaultCompletionModel}`);
    console.log(`Capabilities: ${JSON.stringify(info.capabilities)}`);
    
    // Test completions
    console.log('\n----- Completion Test -----');
    for (const prompt of TEST_PROMPTS) {
      console.log(`\nPrompt: "${prompt}"`);
      console.log('Generating completion...');
      
      const startTime = Date.now();
      const completion = await provider.generateCompletion([
        { role: 'user', content: prompt }
      ]);
      const duration = Date.now() - startTime;
      
      console.log(`Completion (${duration}ms):`);
      console.log(completion);
    }
    
    // Test embeddings if supported
    if (info.capabilities.embeddings) {
      console.log('\n----- Embedding Test -----');
      try {
        const text = "This is a test for embedding generation.";
        console.log(`Generating embedding for: "${text}"`);
        
        const startTime = Date.now();
        const embedding = await provider.generateEmbeddings(text);
        const duration = Date.now() - startTime;
        
        const embeddingArray = Array.isArray(embedding[0]) ? embedding[0] : embedding;
        console.log(`Embedding generated (${duration}ms, dimensions: ${embeddingArray.length})`);
        console.log(`First 5 values: [${embeddingArray.slice(0, 5).join(', ')}]`);
      } catch (error) {
        console.error(`Error testing embeddings: ${error}`);
      }
    } else {
      console.log('\n----- Embedding Test -----');
      console.log('Embeddings not supported by this provider');
    }
    
    console.log(`\n===== ${providerName} Provider Test Completed =====`);
  } catch (error) {
    console.error(`Error testing ${providerName} provider:`, error);
  }
}

/**
 * Run tests for all available providers
 */
async function runTests() {
  const providers = modelManager.listProviders();
  
  if (providers.length === 0) {
    console.error('No model providers configured. Please set API keys in .env.local');
    return;
  }
  
  console.log(`Available providers: ${providers.join(', ')}`);
  
  // Test each provider
  for (const provider of providers) {
    await testProvider(provider);
  }
}

// Parse command line arguments
const specificProvider = process.argv[2];

if (specificProvider) {
  testProvider(specificProvider).catch(console.error);
} else {
  runTests().catch(console.error);
}

// Usage:
// Test all providers: npm run test-models
// Test specific provider: npm run test-models -- openai
