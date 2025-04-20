/**
 * Planning System for Agent Nexus
 * 
 * The cognitive planning system with reflection, self-critics,
 * chain of thoughts, and subgoal decomposition capabilities.
 */

import { MemorySystem } from '../memory';
import { ToolsManager } from '../tools';
import { Reflection } from './reflection';
import { SelfCritics } from './self-critics';
import { ChainOfThoughts } from './chain-of-thoughts';
import { Subgoal, SubgoalData } from './subgoal';

export interface Plan {
  id: string;
  objective: string;
  subgoals: SubgoalData[];
  thoughts: any[];
  reflections: any[];
  criticisms: any[];
  toolsRequired: string[];
  createdAt: string;
  estimatedSteps: number;
}

export class PlanningSystem {
  private memory: MemorySystem;
  private tools: ToolsManager;
  private reflection: Reflection;
  private selfCritics: SelfCritics;
  private chainOfThoughts: ChainOfThoughts;
  private subgoal: Subgoal;
  
  constructor(memory: MemorySystem, tools: ToolsManager) {
    this.memory = memory;
    this.tools = tools;
    
    // Initialize planning components
    this.reflection = new Reflection();
    this.selfCritics = new SelfCritics();
    this.chainOfThoughts = new ChainOfThoughts();
    this.subgoal = new Subgoal();
  }
  
  /**
   * Create a plan for achieving the specified objective
   * 
   * @param objective The objective to plan for
   * @returns A complete plan with subgoals, thoughts, reflections, and criticisms
   */
  async createPlan(objective: string): Promise<Plan> {
    console.log(`Creating plan for objective: ${objective}`);
    
    // 1. Decompose objective into subgoals
    const subgoals = await this.subgoal.decompose(objective);
    
    // 2. Generate chain of thoughts for each subgoal
    const thoughts = await this.chainOfThoughts.generate(subgoals);
    
    // 3. Apply reflection to evaluate the plan
    const reflections = await this.reflection.process(thoughts);
    
    // 4. Apply self-criticism to identify potential issues
    const criticisms = await this.selfCritics.evaluate({
      objective,
      subgoals,
      thoughts,
      reflections
    });
    
    // 5. Identify tools that might be required for this plan
    const toolsRequired = this.identifyRequiredTools(objective, subgoals);
    
    // Create the final plan
    const plan: Plan = {
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      objective,
      subgoals,
      thoughts,
      reflections,
      criticisms,
      toolsRequired,
      createdAt: new Date().toISOString(),
      estimatedSteps: subgoals.length
    };
    
    // Store the plan in memory
    this.memory.store({
      type: 'plan',
      content: plan,
      priority: 8 // Plans are high priority
    });
    
    return plan;
  }
  
  /**
   * Determine if a result should be stored in long-term memory
   * 
   * @param result The result to evaluate
   * @returns Boolean indicating if the result should be stored
   */
  shouldStoreInLongTerm(result: any): boolean {
    // Simple implementation - store all non-error results
    if (typeof result === 'object' && result.error) {
      return false;
    }
    
    return true;
    
    // TODO: In future versions, implement more sophisticated logic that
    // evaluates the novelty, importance, and reusability of the information
  }
  
  /**
   * Generate a system message for the agent based on context
   * 
   * @returns System message for the agent
   */
  generateSystemMessage(): string {
    // Basic system message that describes the agent's capabilities
    return `You are Agent Nexus, an advanced cognitive architecture with human-like reasoning abilities.
You have access to tools for vector search, text generation, code execution, web browsing, 
image analysis, knowledge graphs, document analysis, and RAG retrieval.
You can plan, reflect on your own thoughts, and improve your responses through self-criticism.
When responding, generate a chain of thoughts before providing your final answer.

When facing a complex task:
1. Break it down into manageable subgoals
2. Consider multiple approaches for each subgoal
3. Evaluate the pros and cons of each approach
4. Select the most appropriate approach
5. Reflect on your plan to identify potential issues
6. Revise your plan if necessary
7. Execute the plan step-by-step`;
  }
  
  /**
   * Identify tools that might be required for the plan
   * 
   * @param objective The main objective
   * @param subgoals The subgoals of the plan
   * @returns Array of tool names that might be useful
   */
  private identifyRequiredTools(objective: string, subgoals: any[]): string[] {
    // Combine objective and subgoal descriptions into a single text
    const fullText = [
      objective,
      ...subgoals.map(sg => sg.description)
    ].join(' ');
    
    // Use the tools manager to select appropriate tools
    return this.tools.selectToolsForTask(fullText);
  }
}
