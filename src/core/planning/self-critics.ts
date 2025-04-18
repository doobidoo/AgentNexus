/**
 * Self-Critics Module for Agent Nexus
 * 
 * Enables the agent to critique its own work, identifying
 * potential errors, biases, and areas for improvement.
 */

import { SubgoalData } from './subgoal';
import { ReflectionData } from './reflection';

export interface Criticism {
  id: string;
  target: {
    type: 'plan' | 'subgoal' | 'thought' | 'reflection';
    id: string;
  };
  content: string;
  severity: 'low' | 'medium' | 'high';
  suggestedImprovement?: string;
  createdAt: string;
}

export interface CriticismInput {
  objective: string;
  subgoals: SubgoalData[];
  thoughts: any[];
  reflections: ReflectionData[];
}

export class SelfCritics {
  /**
   * Evaluate a plan and its components to identify potential issues
   * 
   * @param input The plan components to evaluate
   * @returns Array of criticisms with suggested improvements
   */
  async evaluate(input: CriticismInput): Promise<Criticism[]> {
    const criticisms: Criticism[] = [];
    
    // Evaluate the overall plan
    criticisms.push(...await this.evaluateOverallPlan(input));
    
    // Evaluate individual subgoals
    criticisms.push(...await this.evaluateSubgoals(input.subgoals));
    
    // Evaluate thoughts and reasoning
    criticisms.push(...await this.evaluateThoughts(input.thoughts));
    
    return criticisms;
  }
  
  /**
   * Evaluate the overall plan for completeness, feasibility, and effectiveness
   * 
   * @param input The plan components to evaluate
   * @returns Array of criticisms about the overall plan
   */
  private async evaluateOverallPlan(input: CriticismInput): Promise<Criticism[]> {
    const criticisms: Criticism[] = [];
    
    // Check if subgoals are comprehensive enough
    if (input.subgoals.length < 3) {
      criticisms.push({
        id: `criticism-plan-${Date.now()}-1`,
        target: {
          type: 'plan',
          id: 'overall-plan'
        },
        content: 'The plan may not be comprehensive enough. More subgoals might be needed to fully address the objective.',
        severity: 'medium',
        suggestedImprovement: 'Consider breaking down the objective into more detailed subgoals to ensure comprehensive coverage.',
        createdAt: new Date().toISOString()
      });
    }
    
    // Check if dependencies are properly structured
    const hasDependencyCycle = this.checkForDependencyCycles(input.subgoals);
    if (hasDependencyCycle) {
      criticisms.push({
        id: `criticism-plan-${Date.now()}-2`,
        target: {
          type: 'plan',
          id: 'overall-plan'
        },
        content: 'The plan contains circular dependencies between subgoals, which makes execution impossible.',
        severity: 'high',
        suggestedImprovement: 'Restructure the subgoal dependencies to ensure a directed acyclic graph.',
        createdAt: new Date().toISOString()
      });
    }
    
    // Check if the plan addresses the original objective
    const objectiveWords = input.objective.toLowerCase().split(' ');
    const allSubgoalText = input.subgoals.map(sg => sg.description.toLowerCase()).join(' ');
    const missingKeywords = objectiveWords.filter(word => 
      word.length > 4 && !allSubgoalText.includes(word)
    );
    
    if (missingKeywords.length > 0) {
      criticisms.push({
        id: `criticism-plan-${Date.now()}-3`,
        target: {
          type: 'plan',
          id: 'overall-plan'
        },
        content: `The plan may not fully address the original objective. Key concepts like [${missingKeywords.join(', ')}] are not explicitly covered in subgoals.`,
        severity: 'medium',
        suggestedImprovement: 'Add or modify subgoals to explicitly address all key aspects of the objective.',
        createdAt: new Date().toISOString()
      });
    }
    
    return criticisms;
  }
  
  /**
   * Evaluate individual subgoals for clarity, specificity, and feasibility
   * 
   * @param subgoals The subgoals to evaluate
   * @returns Array of criticisms about specific subgoals
   */
  private async evaluateSubgoals(subgoals: SubgoalData[]): Promise<Criticism[]> {
    const criticisms: Criticism[] = [];
    
    subgoals.forEach(subgoal => {
      // Check for vague subgoals
      if (subgoal.description.length < 20 || 
          subgoal.description.includes('etc') ||
          subgoal.description.includes('...')) {
        criticisms.push({
          id: `criticism-subgoal-${Date.now()}-${subgoal.id}`,
          target: {
            type: 'subgoal',
            id: subgoal.id
          },
          content: `Subgoal "${subgoal.description}" is too vague or incomplete.`,
          severity: 'medium',
          suggestedImprovement: 'Make the subgoal more specific with clear, measurable outcomes.',
          createdAt: new Date().toISOString()
        });
      }
      
      // Check for overly complex subgoals
      if ((subgoal.estimatedComplexity || 0) > 8) {
        criticisms.push({
          id: `criticism-subgoal-complexity-${Date.now()}-${subgoal.id}`,
          target: {
            type: 'subgoal',
            id: subgoal.id
          },
          content: `Subgoal "${subgoal.description}" is too complex and should be broken down further.`,
          severity: 'medium',
          suggestedImprovement: 'Decompose this complex subgoal into multiple simpler subgoals.',
          createdAt: new Date().toISOString()
        });
      }
    });
    
    return criticisms;
  }
  
  /**
   * Evaluate thoughts for logical soundness, bias, and completeness
   * 
   * @param thoughts The thoughts to evaluate
   * @returns Array of criticisms about specific thoughts
   */
  private async evaluateThoughts(thoughts: any[]): Promise<Criticism[]> {
    const criticisms: Criticism[] = [];
    
    thoughts.forEach(thought => {
      // Check for low confidence thoughts
      if (thought.confidence < 0.6) {
        criticisms.push({
          id: `criticism-thought-conf-${Date.now()}-${thought.id}`,
          target: {
            type: 'thought',
            id: thought.id
          },
          content: `Low confidence in thought "${thought.content.substring(0, 50)}...". This suggests uncertainty or insufficient information.`,
          severity: 'medium',
          suggestedImprovement: 'Research more information to increase confidence, or consider alternative approaches.',
          createdAt: new Date().toISOString()
        });
      }
      
      // Check for thoughts with no dependencies (except the first few)
      if (thought.dependencies.length === 0 && !thought.id.includes('-thought-1') && !thought.id.includes('-thought-2')) {
        criticisms.push({
          id: `criticism-thought-dep-${Date.now()}-${thought.id}`,
          target: {
            type: 'thought',
            id: thought.id
          },
          content: `Thought "${thought.content.substring(0, 50)}..." appears disconnected from previous reasoning.`,
          severity: 'low',
          suggestedImprovement: 'Clarify how this thought connects to or builds upon previous thoughts.',
          createdAt: new Date().toISOString()
        });
      }
    });
    
    return criticisms;
  }
  
  /**
   * Check for dependency cycles in subgoals
   * 
   * @param subgoals The subgoals to check
   * @returns Boolean indicating if cycles were detected
   */
  private checkForDependencyCycles(subgoals: SubgoalData[]): boolean {
    // Build a dependency graph
    const graph: Record<string, string[]> = {};
    
    subgoals.forEach(subgoal => {
      graph[subgoal.id] = subgoal.dependencies || [];
    });
    
    // Check for cycles using DFS
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    function hasCycle(nodeId: string): boolean {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        
        const neighbors = graph[nodeId] || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && hasCycle(neighbor)) {
            return true;
          } else if (recursionStack.has(neighbor)) {
            return true;
          }
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    }
    
    // Check each node
    for (const nodeId of Object.keys(graph)) {
      if (!visited.has(nodeId)) {
        if (hasCycle(nodeId)) {
          return true;
        }
      }
    }
    
    return false;
  }
}
