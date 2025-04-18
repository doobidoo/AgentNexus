/**
 * Agent Nexus - Main Agent Class
 * 
 * This is the central coordinator for the Agent Nexus cognitive architecture.
 * It integrates memory, tools, planning, and action components into a cohesive
 * agent that can solve complex problems with human-like reasoning abilities.
 */

import { Agent as AgnoAgent } from 'agno';
import { MemorySystem } from './memory';
import { ToolsManager } from './tools';
import { PlanningSystem } from './planning';
import { ActionSystem } from './action';

export interface AgentConfig {
  apiKey: string;
  modelName?: string;
  name?: string;
  description?: string;
}

export class AgentNexus {
  private memory: MemorySystem;
  private tools: ToolsManager;
  private planning: PlanningSystem;
  private action: ActionSystem;
  private agnoAgent: AgnoAgent;

  constructor(config: AgentConfig) {
    // Initialize Agno agent
    this.agnoAgent = new AgnoAgent({
      apiKey: config.apiKey,
      name: config.name || "Agent Nexus",
      description: config.description || "An advanced cognitive agent architecture with human-like reasoning capabilities",
      model: config.modelName || "claude-3-7-sonnet-20250219", // Using Claude for high reasoning capability
    });
    
    // Initialize core components
    this.memory = new MemorySystem();
    this.tools = new ToolsManager();
    this.planning = new PlanningSystem(this.memory, this.tools);
    this.action = new ActionSystem(this.memory, this.tools, this.planning);
    
    // Register tools with Agno
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
    // Store message in short-term memory
    this.memory.store({
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    }, 'short');
    
    // Generate system message with context from planning
    const systemMessage = this.planning.generateSystemMessage();
    
    // Use Agno's chat capability
    const response = await this.agnoAgent.chat([
      { role: "system", content: systemMessage },
      { role: "user", content: message }
    ]);
    
    // Store response in memory
    this.memory.store({
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString()
    }, 'short');
    
    return response;
  }
}
