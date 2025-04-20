/**
 * Tool Execution Framework for Agent Nexus
 * 
 * Provides a comprehensive framework for tool invocation, parameter passing,
 * result processing, and execution lifecycle management.
 */

import { BaseTool, ToolInput, ToolOutput } from './base';
import { EventEmitter } from 'events';

// Execution context for tool operations
export interface ExecutionContext {
  // Unique identifier for this execution context
  id: string;
  // Timestamp when execution started
  startTime: Date;
  // Tool being executed
  tool: BaseTool;
  // Original input parameters
  input: ToolInput;
  // State that can be updated during execution
  state: Record<string, any>;
  // Execution history entries
  history: ExecutionHistoryEntry[];
  // Parent context ID for nested executions
  parentContextId?: string;
  // Metadata for the execution
  metadata: Record<string, any>;
}

// Hooks that can be registered for execution lifecycle
export interface ExecutionHooks {
  // Before parameter validation
  beforeValidation?: (context: ExecutionContext) => Promise<void>;
  // After parameter validation
  afterValidation?: (context: ExecutionContext, isValid: boolean) => Promise<void>;
  // Before tool execution
  beforeExecution?: (context: ExecutionContext) => Promise<void>;
  // After tool execution
  afterExecution?: (context: ExecutionContext, result: ToolOutput) => Promise<ToolOutput>;
  // On execution error
  onError?: (context: ExecutionContext, error: Error) => Promise<ToolOutput | null>;
  // On execution timeout
  onTimeout?: (context: ExecutionContext) => Promise<ToolOutput>;
}

// Execution history entry types
export enum ExecutionHistoryEntryType {
  START = 'execution.start',
  VALIDATION = 'execution.validation',
  PARAMETER_TRANSFORM = 'execution.parameter.transform',
  EXECUTION = 'execution.execute',
  RESULT_TRANSFORM = 'execution.result.transform',
  ERROR = 'execution.error',
  TIMEOUT = 'execution.timeout',
  COMPLETE = 'execution.complete'
}

// Execution history entry for tracking the execution process
export interface ExecutionHistoryEntry {
  type: ExecutionHistoryEntryType;
  timestamp: Date;
  duration?: number;
  message: string;
  details?: any;
}

// Execution options for configuring the execution process
export interface ExecutionOptions {
  // Timeout in milliseconds (default: 30000)
  timeoutMs?: number;
  // Whether to validate parameters (default: true)
  validateParams?: boolean;
  // Whether to transform parameters before execution (default: true)
  transformParams?: boolean;
  // Whether to transform results after execution (default: true)
  transformResults?: boolean;
  // Pre-registered hooks for the execution
  hooks?: ExecutionHooks;
  // Additional metadata for the execution
  metadata?: Record<string, any>;
  // Parent context ID for nested executions
  parentContextId?: string;
  // Whether to track execution history (default: true)
  trackHistory?: boolean;
}

// Default execution options
const DEFAULT_EXECUTION_OPTIONS: ExecutionOptions = {
  timeoutMs: 30000,
  validateParams: true,
  transformParams: true,
  transformResults: true,
  hooks: {},
  metadata: {},
  trackHistory: true
};

// Tool execution events
export enum ToolExecutionEvent {
  EXECUTION_START = 'tool.execution.start',
  EXECUTION_COMPLETE = 'tool.execution.complete',
  EXECUTION_ERROR = 'tool.execution.error',
  EXECUTION_TIMEOUT = 'tool.execution.timeout',
  PARAMETER_VALIDATION = 'tool.execution.parameter.validation',
  RESULT_PRODUCED = 'tool.execution.result.produced'
}

// Parameter transformer function type
export type ParameterTransformer = (
  params: any, 
  context: ExecutionContext
) => Promise<any>;

// Result transformer function type
export type ResultTransformer = (
  result: ToolOutput, 
  context: ExecutionContext
) => Promise<ToolOutput>;

/**
 * The ToolExecutionFramework handles the invocation, parameter passing,
 * and result processing for all tool operations.
 */
export class ToolExecutionFramework extends EventEmitter {
  // Active execution contexts
  private activeContexts: Map<string, ExecutionContext> = new Map();
  // Registered parameter transformers
  private parameterTransformers: ParameterTransformer[] = [];
  // Registered result transformers
  private resultTransformers: ResultTransformer[] = [];
  // Global execution hooks
  private globalHooks: ExecutionHooks = {};
  
  constructor() {
    super();
    // Set up default parameter and result transformers
    this.registerDefaultTransformers();
  }
  
  /**
   * Execute a tool with provided parameters and options
   * 
   * @param tool The tool to execute
   * @param params The parameters to pass to the tool
   * @param context Optional context information
   * @param options Optional execution options
   * @returns Result of the tool execution
   */
  async execute(
    tool: BaseTool,
    params: any,
    context?: any,
    options: ExecutionOptions = {}
  ): Promise<ToolOutput> {
    // Merge with default options
    const mergedOptions: ExecutionOptions = {
      ...DEFAULT_EXECUTION_OPTIONS,
      ...options
    };
    
    // Create standardized input
    const input: ToolInput = {
      params,
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      context
    };
    
    // Create execution context
    const executionContext = this.createExecutionContext(tool, input, mergedOptions);
    
    // Register the context
    this.activeContexts.set(executionContext.id, executionContext);
    
    // Emit execution start event
    this.emit(ToolExecutionEvent.EXECUTION_START, {
      contextId: executionContext.id,
      toolName: tool.name,
      timestamp: new Date(),
      params: input.params
    });
    
    // Add execution start to history
    this.addHistoryEntry(executionContext, {
      type: ExecutionHistoryEntryType.START,
      timestamp: new Date(),
      message: `Started execution of tool: ${tool.name}`
    });
    
    // Create timeout promise if timeout is specified
    const timeoutPromise = mergedOptions.timeoutMs ? this.createTimeoutPromise(
      executionContext, 
      mergedOptions.timeoutMs
    ) : null;
    
    try {
      // Execute with or without timeout
      const executionPromise = this.executeWithLifecycle(executionContext, mergedOptions);
      
      // If timeout is specified, race the execution against the timeout
      const result = timeoutPromise
        ? await Promise.race([executionPromise, timeoutPromise])
        : await executionPromise;
      
      return result;
    } catch (error) {
      return this.handleExecutionError(executionContext, error);
    } finally {
      // Clean up the context
      this.activeContexts.delete(executionContext.id);
    }
  }
  
  /**
   * Execute a tool with its full lifecycle including hooks, validation, and transformations
   * 
   * @param context Execution context
   * @param options Execution options
   * @returns Result of the tool execution
   */
  private async executeWithLifecycle(
    context: ExecutionContext,
    options: ExecutionOptions
  ): Promise<ToolOutput> {
    // Get hooks by merging global hooks with provided hooks
    const hooks = this.mergeHooks(this.globalHooks, options.hooks || {});
    
    // Parameter validation phase
    if (options.validateParams) {
      await this.executeBeforeValidationHooks(context, hooks);
      const isValid = await this.validateParameters(context);
      await this.executeAfterValidationHooks(context, hooks, isValid);
      
      if (!isValid) {
        // Add validation failure to history
        this.addHistoryEntry(context, {
          type: ExecutionHistoryEntryType.VALIDATION,
          timestamp: new Date(),
          message: 'Parameter validation failed',
          details: { params: context.input.params }
        });
        
        return {
          success: false,
          error: 'Invalid input parameters',
          timestamp: new Date().toISOString(),
          requestId: context.input.requestId
        };
      }
    }
    
    // Parameter transformation phase
    if (options.transformParams) {
      await this.transformParameters(context);
    }
    
    // Before execution hook
    await this.executeBeforeExecutionHooks(context, hooks);
    
    // Tool execution phase
    const startTime = Date.now();
    
    this.addHistoryEntry(context, {
      type: ExecutionHistoryEntryType.EXECUTION,
      timestamp: new Date(),
      message: `Executing tool: ${context.tool.name}`,
      details: { params: context.input.params }
    });
    
    const result = await context.tool.execute(context.input);
    
    this.addHistoryEntry(context, {
      type: ExecutionHistoryEntryType.EXECUTION,
      timestamp: new Date(),
      duration: Date.now() - startTime,
      message: `Execution completed: ${result.success ? 'success' : 'failure'}`,
      details: { result }
    });
    
    // Emit result produced event
    this.emit(ToolExecutionEvent.RESULT_PRODUCED, {
      contextId: context.id,
      toolName: context.tool.name,
      timestamp: new Date(),
      result: result,
      executionTime: Date.now() - startTime
    });
    
    // Result transformation phase
    let transformedResult = result;
    if (options.transformResults) {
      transformedResult = await this.transformResults(context, result);
    }
    
    // After execution hook
    transformedResult = await this.executeAfterExecutionHooks(context, hooks, transformedResult);
    
    // Add completion to history
    this.addHistoryEntry(context, {
      type: ExecutionHistoryEntryType.COMPLETE,
      timestamp: new Date(),
      duration: Date.now() - context.startTime.getTime(),
      message: 'Execution completed successfully',
      details: { result: transformedResult }
    });
    
    // Emit execution complete event
    this.emit(ToolExecutionEvent.EXECUTION_COMPLETE, {
      contextId: context.id,
      toolName: context.tool.name,
      timestamp: new Date(),
      result: transformedResult,
      executionTime: Date.now() - context.startTime.getTime()
    });
    
    return transformedResult;
  }
  
  /**
   * Create a promise that resolves after the specified timeout
   * 
   * @param context Execution context
   * @param timeoutMs Timeout in milliseconds
   * @returns Promise that resolves with a timeout error
   */
  private createTimeoutPromise(
    context: ExecutionContext,
    timeoutMs: number
  ): Promise<ToolOutput> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        // Add timeout to history
        this.addHistoryEntry(context, {
          type: ExecutionHistoryEntryType.TIMEOUT,
          timestamp: new Date(),
          message: `Execution timed out after ${timeoutMs}ms`,
          details: { timeoutMs }
        });
        
        // Emit timeout event
        this.emit(ToolExecutionEvent.EXECUTION_TIMEOUT, {
          contextId: context.id,
          toolName: context.tool.name,
          timestamp: new Date(),
          timeoutMs
        });
        
        // Execute timeout hook if available
        const hooks = this.mergeHooks(this.globalHooks, context.metadata.hooks || {});
        if (hooks.onTimeout) {
          const result = await hooks.onTimeout(context);
          resolve(result);
        } else {
          resolve({
            success: false,
            error: `Tool execution timed out after ${timeoutMs}ms`,
            timestamp: new Date().toISOString(),
            requestId: context.input.requestId
          });
        }
      }, timeoutMs);
    });
  }
  
  /**
   * Handle execution errors
   * 
   * @param context Execution context
   * @param error Error that occurred
   * @returns Error output
   */
  private async handleExecutionError(
    context: ExecutionContext,
    error: any
  ): Promise<ToolOutput> {
    // Add error to history
    this.addHistoryEntry(context, {
      type: ExecutionHistoryEntryType.ERROR,
      timestamp: new Date(),
      message: 'Execution error',
      details: { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    });
    
    // Emit error event
    this.emit(ToolExecutionEvent.EXECUTION_ERROR, {
      contextId: context.id,
      toolName: context.tool.name,
      timestamp: new Date(),
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Execute error hook if available
    const hooks = this.mergeHooks(this.globalHooks, context.metadata.hooks || {});
    if (hooks.onError) {
      const result = await hooks.onError(context, error instanceof Error ? error : new Error(String(error)));
      if (result) {
        return result;
      }
    }
    
    // Default error output
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
      requestId: context.input.requestId
    };
  }
  
  /**
   * Create a new execution context
   * 
   * @param tool Tool to execute
   * @param input Input parameters
   * @param options Execution options
   * @returns New execution context
   */
  private createExecutionContext(
    tool: BaseTool,
    input: ToolInput,
    options: ExecutionOptions
  ): ExecutionContext {
    return {
      id: `ctx_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      startTime: new Date(),
      tool,
      input,
      state: {},
      history: [],
      parentContextId: options.parentContextId,
      metadata: {
        ...options.metadata,
        hooks: options.hooks
      }
    };
  }
  
  /**
   * Add an entry to the execution history
   * 
   * @param context Execution context
   * @param entry History entry to add
   */
  private addHistoryEntry(
    context: ExecutionContext,
    entry: ExecutionHistoryEntry
  ): void {
    // Only add history if tracking is enabled
    if (context.metadata.trackHistory !== false) {
      context.history.push(entry);
    }
  }
  
  /**
   * Validate parameters using the tool's validate method
   * 
   * @param context Execution context
   * @returns Boolean indicating if the parameters are valid
   */
  private async validateParameters(context: ExecutionContext): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      // Check if the tool has a validate method
      if (typeof context.tool.validate === 'function') {
        const isValid = await context.tool.validate(context.input);
        
        // Add validation result to history
        this.addHistoryEntry(context, {
          type: ExecutionHistoryEntryType.VALIDATION,
          timestamp: new Date(),
          duration: Date.now() - startTime,
          message: isValid ? 'Parameter validation successful' : 'Parameter validation failed',
          details: { params: context.input.params, isValid }
        });
        
        // Emit validation event
        this.emit(ToolExecutionEvent.PARAMETER_VALIDATION, {
          contextId: context.id,
          toolName: context.tool.name,
          timestamp: new Date(),
          params: context.input.params,
          isValid
        });
        
        return isValid;
      }
      
      // If no validate method, assume valid
      return true;
    } catch (error) {
      // If validation throws an error, consider it invalid
      this.addHistoryEntry(context, {
        type: ExecutionHistoryEntryType.VALIDATION,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        message: 'Parameter validation error',
        details: { 
          params: context.input.params, 
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      // Emit validation event
      this.emit(ToolExecutionEvent.PARAMETER_VALIDATION, {
        contextId: context.id,
        toolName: context.tool.name,
        timestamp: new Date(),
        params: context.input.params,
        isValid: false,
        error: error instanceof Error ? error.message : String(error)
      });
      
      return false;
    }
  }
  
  /**
   * Transform parameters using registered transformers
   * 
   * @param context Execution context
   */
  private async transformParameters(context: ExecutionContext): Promise<void> {
    if (this.parameterTransformers.length === 0) {
      return;
    }
    
    const startTime = Date.now();
    
    try {
      // Apply each transformer in sequence
      let currentParams = context.input.params;
      
      for (const transformer of this.parameterTransformers) {
        currentParams = await transformer(currentParams, context);
      }
      
      // Update the input params with the transformed values
      context.input.params = currentParams;
      
      // Add parameter transformation to history
      this.addHistoryEntry(context, {
        type: ExecutionHistoryEntryType.PARAMETER_TRANSFORM,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        message: 'Parameters transformed',
        details: { 
          originalParams: context.input.params,
          transformedParams: currentParams
        }
      });
    } catch (error) {
      // If transformation fails, add to history but continue with original params
      this.addHistoryEntry(context, {
        type: ExecutionHistoryEntryType.PARAMETER_TRANSFORM,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        message: 'Parameter transformation error',
        details: { 
          params: context.input.params, 
          error: error instanceof Error ? error.message : String(error)
        }
      });
    }
  }
  
  /**
   * Transform results using registered transformers
   * 
   * @param context Execution context
   * @param result Tool execution result
   * @returns Transformed result
   */
  private async transformResults(
    context: ExecutionContext,
    result: ToolOutput
  ): Promise<ToolOutput> {
    if (this.resultTransformers.length === 0) {
      return result;
    }
    
    const startTime = Date.now();
    
    try {
      // Apply each transformer in sequence
      let currentResult = result;
      
      for (const transformer of this.resultTransformers) {
        currentResult = await transformer(currentResult, context);
      }
      
      // Add result transformation to history
      this.addHistoryEntry(context, {
        type: ExecutionHistoryEntryType.RESULT_TRANSFORM,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        message: 'Results transformed',
        details: { 
          originalResult: result,
          transformedResult: currentResult
        }
      });
      
      return currentResult;
    } catch (error) {
      // If transformation fails, add to history but return original result
      this.addHistoryEntry(context, {
        type: ExecutionHistoryEntryType.RESULT_TRANSFORM,
        timestamp: new Date(),
        duration: Date.now() - startTime,
        message: 'Result transformation error',
        details: { 
          result, 
          error: error instanceof Error ? error.message : String(error)
        }
      });
      
      return result;
    }
  }
  
  /**
   * Register a parameter transformer
   * 
   * @param transformer Function to transform parameters
   */
  registerParameterTransformer(transformer: ParameterTransformer): void {
    this.parameterTransformers.push(transformer);
  }
  
  /**
   * Register a result transformer
   * 
   * @param transformer Function to transform results
   */
  registerResultTransformer(transformer: ResultTransformer): void {
    this.resultTransformers.push(transformer);
  }
  
  /**
   * Register global execution hooks
   * 
   * @param hooks Hooks to register
   */
  registerGlobalHooks(hooks: ExecutionHooks): void {
    this.globalHooks = this.mergeHooks(this.globalHooks, hooks);
  }
  
  /**
   * Get an active execution context by ID
   * 
   * @param contextId Context ID
   * @returns Execution context or undefined if not found
   */
  getExecutionContext(contextId: string): ExecutionContext | undefined {
    return this.activeContexts.get(contextId);
  }
  
  /**
   * Get all active execution contexts
   * 
   * @returns Map of context IDs to execution contexts
   */
  getAllExecutionContexts(): Map<string, ExecutionContext> {
    return new Map(this.activeContexts);
  }
  
  /**
   * Cancel an execution context
   * 
   * @param contextId Context ID
   * @returns Boolean indicating if the context was found and cancelled
   */
  cancelExecution(contextId: string): boolean {
    // Note: This doesn't actually stop the execution, it just marks it as cancelled
    // The actual cancellation would need to be implemented at the tool level
    const context = this.activeContexts.get(contextId);
    
    if (context) {
      context.state.cancelled = true;
      
      // Add cancellation to history
      this.addHistoryEntry(context, {
        type: ExecutionHistoryEntryType.ERROR,
        timestamp: new Date(),
        message: 'Execution cancelled',
        details: { contextId }
      });
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Merge two sets of hooks
   * 
   * @param baseHooks Base hooks
   * @param overrideHooks Override hooks
   * @returns Merged hooks
   */
  private mergeHooks(baseHooks: ExecutionHooks, overrideHooks: ExecutionHooks): ExecutionHooks {
    return {
      beforeValidation: overrideHooks.beforeValidation || baseHooks.beforeValidation,
      afterValidation: overrideHooks.afterValidation || baseHooks.afterValidation,
      beforeExecution: overrideHooks.beforeExecution || baseHooks.beforeExecution,
      afterExecution: overrideHooks.afterExecution || baseHooks.afterExecution,
      onError: overrideHooks.onError || baseHooks.onError,
      onTimeout: overrideHooks.onTimeout || baseHooks.onTimeout
    };
  }
  
  /**
   * Execute before validation hooks
   * 
   * @param context Execution context
   * @param hooks Execution hooks
   */
  private async executeBeforeValidationHooks(
    context: ExecutionContext,
    hooks: ExecutionHooks
  ): Promise<void> {
    if (hooks.beforeValidation) {
      await hooks.beforeValidation(context);
    }
  }
  
  /**
   * Execute after validation hooks
   * 
   * @param context Execution context
   * @param hooks Execution hooks
   * @param isValid Whether validation was successful
   */
  private async executeAfterValidationHooks(
    context: ExecutionContext,
    hooks: ExecutionHooks,
    isValid: boolean
  ): Promise<void> {
    if (hooks.afterValidation) {
      await hooks.afterValidation(context, isValid);
    }
  }
  
  /**
   * Execute before execution hooks
   * 
   * @param context Execution context
   * @param hooks Execution hooks
   */
  private async executeBeforeExecutionHooks(
    context: ExecutionContext,
    hooks: ExecutionHooks
  ): Promise<void> {
    if (hooks.beforeExecution) {
      await hooks.beforeExecution(context);
    }
  }
  
  /**
   * Execute after execution hooks
   * 
   * @param context Execution context
   * @param hooks Execution hooks
   * @param result Tool execution result
   * @returns Possibly modified result
   */
  private async executeAfterExecutionHooks(
    context: ExecutionContext,
    hooks: ExecutionHooks,
    result: ToolOutput
  ): Promise<ToolOutput> {
    if (hooks.afterExecution) {
      return await hooks.afterExecution(context, result);
    }
    return result;
  }
  
  /**
   * Register default parameter and result transformers
   */
  private registerDefaultTransformers(): void {
    // Add a default parameter transformer that adds timestamps if not present
    this.registerParameterTransformer(async (params, context) => {
      // If params is an object and doesn't have a timestamp, add one
      if (params && typeof params === 'object' && !params.timestamp) {
        return {
          ...params,
          timestamp: new Date().toISOString()
        };
      }
      return params;
    });
    
    // Add a default result transformer that ensures consistent result format
    this.registerResultTransformer(async (result, context) => {
      // If result doesn't have a timestamp, add one
      if (!result.timestamp) {
        result.timestamp = new Date().toISOString();
      }
      
      // If result doesn't have a requestId, add the one from the input
      if (!result.requestId && context.input.requestId) {
        result.requestId = context.input.requestId;
      }
      
      // If result doesn't have a success property, add it based on error presence
      if (result.success === undefined) {
        result.success = !result.error;
      }
      
      return result;
    });
  }
}
