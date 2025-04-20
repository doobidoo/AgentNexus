/**
 * Execution Module for Agent Nexus
 * 
 * Handles the actual execution of plans with monitoring capabilities
 * and adaptation to changing conditions or unexpected outcomes.
 */

import { ToolsManager } from '../tools';
import { Plan } from '../planning';
import { SubgoalData } from '../planning/subgoal';

export interface ExecutionResult {
  stepsCompleted: number;
  stepResults: Record<string, any>;
  summary: string;
  startTime: string;
  endTime: string;
  duration: number;
  adaptations: Array<{
    step: string;
    reason: string;
    adaptation: string;
  }>;
}

export interface ExecutionOptions {
  maxConcurrentSteps?: number;
  timeoutMs?: number;
  retryCount?: number;
  continueOnError?: boolean;
}

export class Execution {
  private tools: ToolsManager;
  
  constructor(tools: ToolsManager) {
    this.tools = tools;
  }
  
  /**
   * Execute a plan step by step
   * 
   * @param plan The plan to execute
   * @param options Execution options
   * @returns Results of the execution
   */
  async run(plan: Plan, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    const startTime = new Date().toISOString();
    const startTimestamp = Date.now();
    
    const {
      maxConcurrentSteps = 1,
      timeoutMs = 30000,
      retryCount = 1,
      continueOnError = false
    } = options;
    
    console.log(`Starting execution of plan ${plan.id} with ${plan.subgoals.length} subgoals`);
    
    const stepResults: Record<string, any> = {};
    const adaptations: Array<{step: string; reason: string; adaptation: string}> = [];
    let stepsCompleted = 0;
    
    // Simplified execution for now - one step at a time
    for (const subgoal of plan.subgoals) {
      try {
        console.log(`Executing subgoal: ${subgoal.id} - ${subgoal.description}`);
        
        // Determine which tools might be useful for this subgoal
        const toolsForSubgoal = this.tools.selectToolsForTask(subgoal.description);
        
        // Execute the subgoal
        const subgoalResult = await this.executeSubgoal(subgoal, toolsForSubgoal);
        
        // Store the result
        stepResults[subgoal.id] = subgoalResult;
        stepsCompleted++;
        
      } catch (error) {
        console.error(`Error executing subgoal ${subgoal.id}:`, error);
        
        // Try to adapt to the error
        const adaptation = this.adaptToError(subgoal, error);
        
        if (adaptation) {
          adaptations.push({
            step: subgoal.id,
            reason: error instanceof Error ? error.message : String(error),
            adaptation: adaptation
          });
          
          // Store the error and adaptation as the result
          stepResults[subgoal.id] = {
            error: error instanceof Error ? error.message : String(error),
            adaptation
          };
        } else {
          // Store just the error
          stepResults[subgoal.id] = {
            error: error instanceof Error ? error.message : String(error)
          };
        }
        
        // If not continuing on error, stop execution
        if (!continueOnError) {
          break;
        }
      }
    }
    
    const endTime = new Date().toISOString();
    const duration = Date.now() - startTimestamp;
    
    // Generate a summary of the execution
    const summary = this.generateSummary(plan, stepsCompleted, stepResults, adaptations);
    
    return {
      stepsCompleted,
      stepResults,
      summary,
      startTime,
      endTime,
      duration,
      adaptations
    };
  }
  
  /**
   * Execute a single subgoal using appropriate tools
   * 
   * @param subgoal The subgoal to execute
   * @param toolNames Names of tools that might be useful
   * @returns Result of the subgoal execution
   */
  private async executeSubgoal(subgoal: SubgoalData, toolNames: string[]): Promise<any> {
    // Simplified implementation
    // In a real system, this would analyze the subgoal, determine the steps,
    // and execute them using the appropriate tools
    
    // For now, we'll simulate results
    await new Promise(resolve => setTimeout(resolve, 100 * (subgoal.estimatedComplexity || 1)));
    
    // Simulate tool usage
    const toolResults: Record<string, any> = {};
    
    for (const toolName of toolNames) {
      if (this.tools.hasTool(toolName)) {
        try {
          const result = await this.tools.useTool(toolName, {
            query: subgoal.description,
            context: {
              subgoalId: subgoal.id,
              dependencies: subgoal.dependencies
            }
          });
          
          toolResults[toolName] = result;
        } catch (error) {
          console.warn(`Tool ${toolName} failed:`, error);
          toolResults[toolName] = {
            error: error instanceof Error ? error.message : String(error)
          };
        }
      }
    }
    
    return {
      completed: true,
      status: 'success',
      toolResults,
      result: `Executed subgoal: ${subgoal.description}`,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Generate a summary of the execution results
   * 
   * @param plan The original plan
   * @param stepsCompleted Number of completed steps
   * @param stepResults Results of each step
   * @param adaptations Adaptations made during execution
   * @returns Summary string
   */
  private generateSummary(
    plan: Plan,
    stepsCompleted: number,
    stepResults: Record<string, any>,
    adaptations: Array<{step: string; reason: string; adaptation: string}>
  ): string {
    let summary = `Execution of plan for objective: "${plan.objective}"\n\n`;
    
    summary += `Completed ${stepsCompleted} of ${plan.subgoals.length} subgoals.\n\n`;
    
    // Add step results
    summary += `Step Results:\n`;
    
    plan.subgoals.forEach(subgoal => {
      const result = stepResults[subgoal.id];
      
      if (!result) {
        summary += `- ${subgoal.description}: Not executed\n`;
      } else if (result.error) {
        summary += `- ${subgoal.description}: Failed - ${result.error}\n`;
      } else {
        summary += `- ${subgoal.description}: Completed successfully\n`;
      }
    });
    
    // Add adaptations if any
    if (adaptations.length > 0) {
      summary += `\nAdaptations made during execution:\n`;
      
      adaptations.forEach(adaptation => {
        const subgoal = plan.subgoals.find(sg => sg.id === adaptation.step);
        summary += `- ${subgoal?.description || adaptation.step}: ${adaptation.adaptation} (Reason: ${adaptation.reason})\n`;
      });
    }
    
    return summary;
  }
  
  /**
   * Attempt to adapt to an error during execution
   * 
   * @param subgoal The subgoal that failed
   * @param error The error that occurred
   * @returns Adaptation strategy or null if no adaptation is possible
   */
  private adaptToError(subgoal: SubgoalData, error: any): string | null {
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Simple adaptation strategies
    if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
      return 'Simplified the subgoal to focus on essential components only';
    }
    
    if (errorMsg.includes('permission') || errorMsg.includes('access')) {
      return 'Modified approach to use alternative methods that don\'t require special permissions';
    }
    
    if (errorMsg.includes('not found') || errorMsg.includes('unavailable')) {
      return 'Switched to alternative resources or information sources';
    }
    
    // Generic adaptation
    return 'Modified execution approach based on encountered difficulties';
  }
}
