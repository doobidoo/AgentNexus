/**
 * Agent Nexus - Main Agent Class
 * 
 * This is the central coordinator for the Agent Nexus cognitive architecture.
 * It integrates memory, tools, planning, and action components into a cohesive
 * agent that can solve complex problems with human-like reasoning abilities.
 */

// We're replacing the agno import with our own Agent interface
interface AgnoAgent {
  name: string;
  description: string;
  model: string;
}

import { ModelProvider, ModelMessage } from './models';
import { modelManager } from './models/factory';
import { MemorySystem } from './memory';
import { ToolsManager } from './tools';
import { PlanningSystem } from './planning';
import { ActionSystem } from './action';

export interface AgentConfig {
  modelProvider?: ModelProvider | string;
  modelName?: string;
  agentName?: string;
  description?: string;
  apiKey?: string;
}

export class AgentNexus {
  private memory: MemorySystem;
  private tools: ToolsManager;
  private planning: PlanningSystem;
  private action: ActionSystem;
  private agnoAgent: AgnoAgent;
  private modelProvider: ModelProvider;
  private modelName: string;
  private agentName: string;
  private description: string;
  private apiKey?: string;

  constructor(config: AgentConfig = {}) {
    // Get model provider
    if (typeof config.modelProvider === 'string') {
      this.modelProvider = modelManager.getProvider(config.modelProvider);
    } else if (config.modelProvider) {
      this.modelProvider = config.modelProvider;
    } else {
      this.modelProvider = modelManager.getProvider();
    }
    
    // Store API key if provided
    if (config.apiKey) {
      // This can be used for any API calls that need authentication
      this.apiKey = config.apiKey;
    }
    
    // Set model name (use provider's default if not specified)
    this.modelName = config.modelName || this.modelProvider.getInfo().defaultCompletionModel;
    
    // Set agent name and description
    this.agentName = config.agentName || "Agent Nexus";
    this.description = config.description || "An advanced cognitive agent architecture with human-like reasoning capabilities";
    
    // Create our own agent implementation instead of using agno
    this.agnoAgent = {
      name: this.agentName,
      description: this.description,
      model: this.modelName,
    };
    
    // Initialize core components
    this.memory = new MemorySystem();
    this.tools = new ToolsManager();
    this.planning = new PlanningSystem(this.memory, this.tools);
    this.action = new ActionSystem(this.memory, this.tools, this.planning);
    
    // Register tools
    this.registerTools();
  }
  
  /**
   * Registers all available tools with the Agno agent
   */
  private registerTools() {
    // This will be implemented as tools are developed
    console.log("Tool registration will be implemented in future versions");
  }
  
  /**
   * Process a complex task using the agent's cognitive architecture
   * 
   * @param task The task description or request
   * @returns The result of processing the task
   */
  async processTask(task: string): Promise<string> {
    // 1. Update short-term memory with task
    this.memory.store(task);
    
    // 2. Create a plan using the planning system
    const plan = await this.planning.createPlan(task);
    
    // 3. Execute the plan using the action system
    const result = await this.action.executePlan(plan);
    
    // 4. Store results in long-term memory if valuable
    if (this.planning.shouldStoreInLongTerm(result)) {
      this.memory.store({
        task,
        plan,
        result,
        timestamp: new Date().toISOString()
      }, 'long');
    }
    
    return result;
  }
  
  /**
   * Chat with the agent directly, simpler than full task processing
   * 
   * @param message The user message
   * @returns The agent's response
   */
  async chat(message: string): Promise<string> {
    console.log(`[Agent] Chat request with model: ${this.modelName} from provider: ${this.modelProvider.getInfo().name}`);
    
    // Store message in short-term memory
    this.memory.store({
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    }, 'short');
    
    // Generate system message with context from planning
    const systemMessage = this.planning.generateSystemMessage();
    
    // Create messages array for the model
    const messages: ModelMessage[] = [
      { role: "system", content: systemMessage },
      { role: "user", content: message }
    ];
    
    try {
      // Use the model provider directly for chat
      console.log(`[Agent] Sending request to provider...`);
      
      const response = await this.modelProvider.generateCompletion(messages, {
        temperature: 0.7,
        maxTokens: 1000,
        responseFormat: { model: this.modelName }
      });
      
      console.log(`[Agent] Got response of length: ${response?.length || 0}`);
      
      // Store response in memory
      this.memory.store({
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      }, 'short');
      
      return response;
    } catch (error) {
      // Log the error but return a user-friendly message
      console.error('[Agent] Error in chat method:', error);
      
      // Create a simple fallback response if the model fails
      if (this.modelProvider.getInfo().name === 'Demo Provider') {
        return `This is a demo response. The model would normally generate a response to: "${message.substring(0, 50)}..."\n\nPlease configure actual API keys for better results.`;
      }
      
      throw new Error(`Failed to generate a response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get the information about the model provider being used
   * 
   * @returns Model provider information
   */
  getModelInfo() {
    return {
      provider: this.modelProvider.getInfo().name,
      model: this.modelName,
      agentName: this.agentName
    };
  }
  
  /**
   * Switch to a different model provider
   * 
   * @param providerName Name of the provider to switch to
   * @param modelName Optional model name to use
   */
  switchModelProvider(providerName: string, modelName?: string) {
    // Get the new model provider
    const newProvider = modelManager.getProvider(providerName);
    
    // Update the provider and model name
    this.modelProvider = newProvider;
    this.modelName = modelName || newProvider.getInfo().defaultCompletionModel;
    
    console.log(`Switched to ${this.modelProvider.getInfo().name} provider with model ${this.modelName}`);
  }
}
