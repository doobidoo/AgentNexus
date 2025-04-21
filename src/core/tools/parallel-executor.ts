/**
 * Parallel Tool Execution for Agent Nexus
 * 
 * Implements the capability to execute multiple compatible tools in parallel
 * to improve performance for independent operations.
 */

import { BaseTool, ToolInput, ToolOutput } from './base';
import { ExecutionContext, ExecutionOptions, ToolExecutionFramework } from './execution-context';

/**
 * Parallel execution result containing individual tool results
 */
export interface ParallelExecutionResult {
  // Overall success status
  success: boolean;
  // Results from each tool execution keyed by name
  results: Record<string, ToolOutput>;
  // Combined timestamp
  timestamp: string;
  // Combined request ID
  requestId: string;
  // Execution statistics
  stats: {
    // Total execution time in milliseconds
    totalTimeMs: number;
    // Time saved compared to sequential execution in milliseconds
    timeSavedMs: number;
    // Number of tools executed in parallel
    parallelCount: number;
    // Number of tools executed sequentially
    sequentialCount: number;
  };
}

/**
 * Parallel execution options
 */
export interface ParallelExecutionOptions extends ExecutionOptions {
  // Maximum number of parallel executions (default: 4)
  maxParallel?: number;
  // Whether to return on first error or wait for all executions (default: true)
  failFast?: boolean;
  // Whether to combine results into a single result object (default: true)
  combineResults?: boolean;
  // Custom execution order based on dependencies
  executionOrder?: string[][];
}

/**
 * Tool execution plan entry
 */
interface ExecutionPlanEntry {
  // Tool to execute
  tool: BaseTool;
  // Parameters for the tool
  params: any;
  // Context information
  context?: any;
  // Execution options
  options?: ExecutionOptions;
  // Names of tools this tool depends on
  dependencies?: string[];
}

/**
 * The ParallelExecutor allows multiple tools to be executed in parallel
 * when they are compatible and don't depend on each other's results.
 */
export class ParallelExecutor {
  private executionFramework: ToolExecutionFramework;
  
  /**
   * Create a new ParallelExecutor
   * 
   * @param executionFramework The execution framework to use
   */
  constructor(executionFramework: ToolExecutionFramework) {
    this.executionFramework = executionFramework;
  }
  
  /**
   * Execute multiple tools in parallel when possible
   * 
   * @param executionPlan Map of tool names to execution plan entries
   * @param options Parallel execution options
   * @returns Combined execution result
   */
  async executeParallel(
    executionPlan: Record<string, ExecutionPlanEntry>,
    options: ParallelExecutionOptions = {}
  ): Promise<ParallelExecutionResult> {
    const startTime = Date.now();
    
    // Default options
    const mergedOptions: Required<ParallelExecutionOptions> = {
      timeoutMs: options.timeoutMs || 30000,
      validateParams: options.validateParams !== false,
      transformParams: options.transformParams !== false,
      transformResults: options.transformResults !== false,
      hooks: options.hooks || {},
      metadata: options.metadata || {},
      parentContextId: options.parentContextId || '',  // Provide empty string as fallback
      trackHistory: options.trackHistory !== false,
      maxParallel: options.maxParallel || 4,
      failFast: options.failFast !== false,
      combineResults: options.combineResults !== false,
      executionOrder: options.executionOrder || []  // Provide empty array as fallback
    };
    
    // Generate a common request ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    
    // Determine execution order based on dependencies
    const phases = this.determineExecutionPhases(executionPlan, mergedOptions.executionOrder);
    
    // Track results
    const results: Record<string, ToolOutput> = {};
    let hasErrors = false;
    let sequentialCount = 0;
    let parallelCount = 0;
    
    // Sequential time estimation (for statistics)
    let estimatedSequentialTimeMs = 0;
    
    // Execute each phase in sequence
    for (const phase of phases) {
      // Track the start time of this phase
      const phaseStartTime = Date.now();
      
      if (hasErrors && mergedOptions.failFast) {
        // Skip remaining phases if failFast is enabled and there are errors
        break;
      }
      
      // If only one tool in this phase, execute it directly
      if (phase.length === 1) {
        const toolName = phase[0];
        const entry = executionPlan[toolName];
        
        if (!entry) {
          console.warn(`Tool not found in execution plan: ${toolName}`);
          continue;
        }
        
        sequentialCount++;
        
        try {
          // Execute the tool
          const result = await this.executionFramework.execute(
            entry.tool,
            entry.params,
            {
              ...entry.context,
              previousResults: results // Include previous results as context
            },
            {
              ...mergedOptions,
              ...entry.options
            }
          );
          
          // Store the result
          results[toolName] = result;
          
          // Update error flag
          if (!result.success) {
            hasErrors = true;
          }
          
          // Update estimated sequential time
          estimatedSequentialTimeMs += Date.now() - phaseStartTime;
        } catch (error) {
          hasErrors = true;
          results[toolName] = {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
            requestId
          };
          
          // Update estimated sequential time
          estimatedSequentialTimeMs += Date.now() - phaseStartTime;
        }
      } else {
        // Execute tools in this phase in parallel
        const toolExecutions: Promise<[string, ToolOutput]>[] = [];
        
        // Limit parallel executions based on maxParallel
        const batchSize = mergedOptions.maxParallel;
        for (let i = 0; i < phase.length; i += batchSize) {
          const batch = phase.slice(i, i + batchSize);
          parallelCount += batch.length;
          
          // Create promises for each tool in the batch
          const batchPromises = batch.map(toolName => {
            const entry = executionPlan[toolName];
            
            if (!entry) {
              console.warn(`Tool not found in execution plan: ${toolName}`);
              return Promise.resolve([
                toolName,
                {
                  success: false,
                  error: `Tool not found in execution plan: ${toolName}`,
                  timestamp: new Date().toISOString(),
                  requestId
                }
              ]) as Promise<[string, ToolOutput]>;
            }
            
            return this.executionFramework.execute(
              entry.tool,
              entry.params,
              {
                ...entry.context,
                previousResults: results // Include previous results as context
              },
              {
                ...mergedOptions,
                ...entry.options
              }
            ).then(result => [toolName, result] as [string, ToolOutput]);
          });
          
          // Wait for all promises in this batch to resolve
          const batchResults = await Promise.all(batchPromises);
          
          // Store the results
          for (const [toolName, result] of batchResults) {
            results[toolName] = result;
            
            // Update error flag
            if (!result.success) {
              hasErrors = true;
            }
          }
          
          // Break if failFast is enabled and there are errors
          if (hasErrors && mergedOptions.failFast) {
            break;
          }
        }
        
        // Update estimated sequential time (assume each tool would have taken the same time)
        estimatedSequentialTimeMs += (Date.now() - phaseStartTime) * phase.length;
      }
    }
    
    // Calculate time saved
    const actualTimeMs = Date.now() - startTime;
    const timeSavedMs = Math.max(0, estimatedSequentialTimeMs - actualTimeMs);
    
    // Create combined result
    const combinedResult: ParallelExecutionResult = {
      success: !hasErrors,
      results,
      timestamp: new Date().toISOString(),
      requestId,
      stats: {
        totalTimeMs: actualTimeMs,
        timeSavedMs,
        parallelCount,
        sequentialCount
      }
    };
    
    return combinedResult;
  }
  
  /**
   * Determine the execution phases based on tool dependencies
   * 
   * @param executionPlan Map of tool names to execution plan entries
   * @param manualOrder Optional manual execution order
   * @returns Array of phases, where each phase is an array of tool names
   */
  private determineExecutionPhases(
    executionPlan: Record<string, ExecutionPlanEntry>,
    manualOrder?: string[][]
  ): string[][] {
    // If manual order is provided and not empty, use it
    if (manualOrder && Array.isArray(manualOrder) && manualOrder.length > 0) {
      return manualOrder;
    }
    
    // Build dependency graph
    const dependencyGraph: Record<string, string[]> = {};
    const toolNames = Object.keys(executionPlan);
    
    // Initialize dependency graph
    for (const toolName of toolNames) {
      dependencyGraph[toolName] = [];
    }
    
    // Populate dependencies
    for (const toolName of toolNames) {
      const entry = executionPlan[toolName];
      
      if (entry.dependencies && Array.isArray(entry.dependencies)) {
        for (const dependency of entry.dependencies) {
          if (toolNames.includes(dependency)) {
            dependencyGraph[toolName].push(dependency);
          }
        }
      }
    }
    
    // Topological sort to determine execution order
    const visited = new Set<string>();
    const phases: string[][] = [];
    
    while (visited.size < toolNames.length) {
      const currentPhase: string[] = [];
      
      // Find all tools that have all dependencies satisfied
      for (const toolName of toolNames) {
        if (visited.has(toolName)) {
          continue;
        }
        
        const dependencies = dependencyGraph[toolName];
        const allDependenciesSatisfied = dependencies.every(dep => visited.has(dep));
        
        if (allDependenciesSatisfied) {
          currentPhase.push(toolName);
        }
      }
      
      // If no tools could be added to this phase, we have a dependency cycle
      if (currentPhase.length === 0) {
        const unvisited = toolNames.filter(name => !visited.has(name));
        console.warn(`Dependency cycle detected. Executing remaining tools sequentially: ${unvisited.join(', ')}`);
        
        // Add each remaining tool as its own phase
        for (const toolName of unvisited) {
          phases.push([toolName]);
          visited.add(toolName);
        }
        
        break;
      }
      
      // Add current phase to phases
      phases.push(currentPhase);
      
      // Mark all tools in this phase as visited
      for (const toolName of currentPhase) {
        visited.add(toolName);
      }
    }
    
    return phases;
  }
}