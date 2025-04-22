/**
 * TextGeneration Tool for Agent Nexus
 * 
 * Provides context-aware content creation using language models.
 */

import { AbstractTool, ToolInput, ToolOutput } from './base';

export interface TextGenerationParams {
  prompt: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  systemMessage?: string;
}

export class TextGeneration extends AbstractTool {
  constructor() {
    super(
      'textGeneration',
      'Generate context-aware content using language models',
      ['text generation', 'content creation', 'writing', 'summarization'],
      '1.0.0'
    );
    
    // Get default model from environment or use a fallback
    const defaultModel = process.env.NEXUS_TOOL_TEXTGENERATION_MODEL || 'default';
    
    // Register config with the ToolConfigManager
    if (typeof window === 'undefined') {
      try {
        // Dynamic import to avoid issues in browser environment
        const { configManager } = require('./config-manager');
        
        // Register configuration schema
        configManager.registerToolConfig(
          'textGeneration',
          {
            properties: {
              model: {
                type: 'string',
                description: 'Default language model to use for text generation',
                default: defaultModel
              },
              temperature: {
                type: 'number',
                description: 'Default temperature for text generation (0-1)',
                default: 0.7
              },
              maxTokens: {
                type: 'number',
                description: 'Default maximum tokens to generate',
                default: 1000
              }
            },
            required: ['model']
          },
          {
            model: defaultModel,
            temperature: 0.7,
            maxTokens: 1000
          }
        );
      } catch (error) {
        console.error('Failed to register text generation configuration:', error);
      }
    }
  }
  
  /**
   * Validate the text generation parameters
   * 
   * @param input Tool input to validate
   * @returns Boolean indicating if the input is valid
   */
  validate(input: ToolInput): boolean {
    const params = input.params as TextGenerationParams;
    
    if (!params) return false;
    if (!params.prompt || typeof params.prompt !== 'string') return false;
    
    // Optional parameter validation
    if (params.temperature !== undefined && (typeof params.temperature !== 'number' || params.temperature < 0 || params.temperature > 1)) return false;
    if (params.maxTokens !== undefined && (typeof params.maxTokens !== 'number' || params.maxTokens <= 0)) return false;
    
    return true;
  }
  
  /**
   * Execute text generation with the provided parameters
   * 
   * @param input Text generation parameters and context
   * @returns Generated content
   */
  async execute(input: ToolInput): Promise<ToolOutput> {
    try {
      // Validate input
      if (!this.validate(input)) {
        return this.createErrorOutput('Invalid input parameters', input);
      }
      
      const params = input.params as TextGenerationParams;
      const { 
        prompt,
        context = '',
        temperature = 0.7,
        maxTokens = 256,
        model = 'claude-3-7-sonnet-20250219',
        systemMessage = 'You are a helpful assistant that generates high-quality content.'
      } = params;
      
      console.log(`Generating text for prompt: "${prompt.substring(0, 50)}..."`);
      
      // In a real implementation, this would connect to an LLM API like OpenAI or Claude
      // For now, we'll simulate the response
      const generatedText = await this.simulateTextGeneration(prompt, context, temperature, model, systemMessage);
      
      return this.createSuccessOutput(generatedText, input);
    } catch (error) {
      console.error('Error in text generation:', error);
      return this.createErrorOutput(`Text generation failed: ${error}`, input);
    }
  }
  
  /**
   * Simulate text generation (for demonstration purposes)
   * In a real implementation, this would call an LLM API
   * 
   * @param prompt The generation prompt
   * @param context Additional context
   * @param temperature Temperature parameter for generation
   * @param model Model to use
   * @param systemMessage System message for the LLM
   * @returns Simulated generated text
   */
  private async simulateTextGeneration(
    prompt: string,
    context: string,
    temperature: number,
    model: string,
    systemMessage: string
  ): Promise<string> {
    // Simulate response delay based on prompt length and temperature
    const delayMs = 100 + prompt.length / 2 + temperature * 500;
    await new Promise(resolve => setTimeout(resolve, delayMs));
    
    // Create some sample outputs based on the prompt
    const lowercasePrompt = prompt.toLowerCase();
    
    if (lowercasePrompt.includes('summarize') || lowercasePrompt.includes('summary')) {
      return `Summary of the provided content:

1. Key Point A - The main subject relates to ${context ? context : 'the topic in question'}.
2. Key Point B - Several important factors were identified.
3. Key Point C - The conclusion suggests further exploration is warranted.

This summary covers the essential elements while condensing the original material significantly.`;
    }
    
    if (lowercasePrompt.includes('list') || lowercasePrompt.includes('steps')) {
      return `Here's a list based on your request:

1. First item: Initial considerations
2. Second item: Main components
3. Third item: Implementation strategy
4. Fourth item: Testing methodology
5. Fifth item: Evaluation criteria

These steps provide a structured approach to the topic.`;
    }
    
    if (lowercasePrompt.includes('explain') || lowercasePrompt.includes('how to')) {
      return `Explanation:

The process involves several interconnected components. First, you need to understand the fundamental principles that govern the system. This includes recognizing how different elements interact and influence outcomes.

Second, practical application requires careful consideration of context-specific factors. What works in one situation may need adaptation in another.

Finally, continuous evaluation and adjustment optimize results over time, creating a feedback loop that promotes ongoing improvement.`;
    }
    
    // Default response for other types of prompts
    return `Generated content based on your prompt: "${prompt}"

The ${context ? 'provided context' : 'subject matter'} presents interesting considerations when examined closely. There are multiple perspectives that merit exploration, each offering unique insights.

From one angle, we can observe patterns that suggest underlying principles at work. These principles help explain observed phenomena and predict future developments.

From another perspective, practical applications emerge that demonstrate real-world relevance. These applications showcase how theoretical understanding translates into tangible benefits.

This response was generated with temperature ${temperature} using a simulation of the ${model} model.`;
  }
}
