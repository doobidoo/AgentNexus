/**
 * Action System for Agent Nexus
 * 
 * The execution layer that implements plans from the planning system
 * and processes feedback to improve future performance.
 */

import { MemorySystem } from '../memory';
import { ToolsManager } from '../tools';
import { PlanningSystem, Plan } from '../planning';
import { Execution } from './execution';
import { Feedback } from './feedback';

export interface ActionResult {
  success: boolean;
  data?: any;
  error?: string;
  metrics: {
    startTime: string;
    endTime: string;
    duration: number;
    stepsCompleted: number;
    totalSteps: number;
  };
  feedback: any[];
}

export class ActionSystem {
  private memory: MemorySystem;
  private tools: ToolsManager;
  private planning: PlanningSystem;
  private execution: Execution;
  private feedback: Feedback;
  
  constructor(memory: MemorySystem, tools: ToolsManager, planning: PlanningSystem) {
    this.memory = memory;
    this.tools = tools;
    this.planning = planning;
    this.execution = new Execution(tools);
    this.feedback = new Feedback();
  }
  
  /**
   * Execute a plan from the planning system
   * 
   * @param plan The plan to execute
   * @returns Result of the execution
   */
  async executePlan(plan: Plan): Promise<string> {
    console.log(`Executing plan: ${plan.id} for objective: ${plan.objective}`);
    
    const startTime = new Date().toISOString();
    const startTimestamp = Date.now();
    
    try {
      // 1. Execute each step of the plan
      const executionResults = await this.execution.run(plan);
      
      // 2. Gather feedback during execution
      const feedbackData = this.feedback.collect(plan, executionResults);
      
      // 3. Update memory with execution results and feedback
      this.memory.store({
        type: 'execution',
        plan: plan.id,
        results: executionResults,
        feedback: feedbackData,
        timestamp: new Date().toISOString()
      }, 'short');
      
      // 4. Process results and return final output
      const endTime = new Date().toISOString();
      const duration = Date.now() - startTimestamp;
      
      const result: ActionResult = {
        success: true,
        data: executionResults,
        metrics: {
          startTime,
          endTime,
          duration,
          stepsCompleted: executionResults.stepsCompleted,
          totalSteps: plan.subgoals.length
        },
        feedback: feedbackData
      };
      
      return this.formatResults(result);
    } catch (error) {
      console.error('Error executing plan:', error);
      
      const endTime = new Date().toISOString();
      const duration = Date.now() - startTimestamp;
      
      const result: ActionResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metrics: {
          startTime,
          endTime,
          duration,
          stepsCompleted: 0,
          totalSteps: plan.subgoals.length
        },
        feedback: [{
          type: 'error',
          content: `Execution failed: ${error instanceof Error ? error.message : String(error)}`,
          severity: 'high'
        }]
      };
      
      this.memory.store({
        type: 'execution_error',
        plan: plan.id,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }, 'short');
      
      return this.formatResults(result);
    }
  }
  
  /**
   * Format execution results into a human-readable string
   * 
   * @param result The execution result object
   * @returns Formatted string result
   */
  private formatResults(result: ActionResult): string {
    if (!result.success) {
      return `Execution failed: ${result.error}. Execution started at ${result.metrics.startTime} and lasted ${result.metrics.duration}ms.`;
    }
    
    // For successful execution, format a more detailed response
    let formattedResult = `Successfully executed plan in ${result.metrics.duration}ms.\n`;
    formattedResult += `Completed ${result.metrics.stepsCompleted} of ${result.metrics.totalSteps} steps.\n\n`;
    
    formattedResult += `Results:\n`;
    
    if (typeof result.data === 'string') {
      formattedResult += result.data;
    } else if (result.data && result.data.summary) {
      formattedResult += result.data.summary;
    } else {
      formattedResult += JSON.stringify(result.data, null, 2);
    }
    
    // Add feedback insights if available
    if (result.feedback && result.feedback.length > 0) {
      formattedResult += `\n\nInsights from execution:\n`;
      result.feedback.forEach((item, index) => {
        formattedResult += `${index + 1}. ${item.content}\n`;
      });
    }
    
    return formattedResult;
  }
}
