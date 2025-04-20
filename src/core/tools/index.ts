/**
 * Enhanced Tools Manager for Agent Nexus
 * 
 * Provides a standardized tool interface and management system
 * that enables dynamic tool selection based on task requirements.
 * Includes comprehensive execution framework for tool invocation,
 * parameter validation, and result processing.
 */

import { BaseTool, ToolInput, ToolOutput } from './base';
import { ExecutionContext, ExecutionHistoryEntry, ExecutionHistoryEntryType, ExecutionHooks, ExecutionOptions, ToolExecutionEvent, ToolExecutionFramework } from './execution-context';
import { ParallelExecutionOptions, ParallelExecutionResult, ParallelExecutor } from './parallel-executor';
import { VectorSearch } from './vector-search';
import { TextGeneration } from './text-generation';
import { CodeExecutor } from './code-executor';
import { WebBrowser } from './web-browser';
import { EventEmitter } from 'events';
import { configManager, ConfigEventType, ToolConfigSchema } from './config-manager';

// Tool registry type
export type ToolRegistry = Record<string, BaseTool>;

// Tool metadata for efficient lookup
export interface ToolMetadata {
  name: string;
  description: string;
  capabilities: string[];
  version: string;
  tags?: string[];
  lastUsed?: Date;
  useCount?: number;
  averageExecutionTime?: number;
  additionalMetadata?: Record<string, any>;
}

// Tool event types
export enum ToolEventType {
  REGISTERED = 'tool.registered',
  UNREGISTERED = 'tool.unregistered',
  EXECUTED = 'tool.executed',
  EXECUTION_FAILED = 'tool.execution.failed',
  CONFIGURATION_CHANGED = 'tool.configuration.changed',
  CONFIG_VALIDATION_ERROR = 'tool.configuration.validation.error'
}

// Tool event structure
export interface ToolEvent {
  type: ToolEventType;
  toolName: string;
  timestamp: string;
  details?: any;
}

export class ToolsManager extends EventEmitter {
  // Execution framework for tool operations
  private executionFramework: ToolExecutionFramework;
  // Parallel executor for concurrent tool operations
  private parallelExecutor: ParallelExecutor;
  // Registry of available tools
  private tools: ToolRegistry;
  // Tool metadata for efficient lookup
  private toolMetadata: Record<string, ToolMetadata>;
  
  constructor() {
    super();
    // Initialize with empty registry
    this.tools = {};
    this.toolMetadata = {};
    
    // Initialize execution framework
    this.executionFramework = new ToolExecutionFramework();
    
    // Initialize parallel executor
    this.parallelExecutor = new ParallelExecutor(this.executionFramework);
    
    // Forward execution events
    this.forwardExecutionEvents();
    
    // Register default tools
    this.registerDefaultTools();
  }
  
  /**
   * Register a tool with the manager
   * 
   * @param tool The tool to register
   * @returns boolean indicating if registration was successful
   */
  registerTool(tool: BaseTool, configSchema?: ToolConfigSchema, defaultConfig?: Record<string, any>): boolean {
    // Validate that the tool implements the required interface
    if (!this.validateToolInterface(tool)) {
      console.error(`Tool validation failed for ${tool.name}`);
      return false;
    }
    
    // Register the tool
    this.tools[tool.name] = tool;
    
    // Store metadata for efficient lookup
    this.toolMetadata[tool.name] = {
      name: tool.name,
      description: tool.description,
      capabilities: tool.capabilities,
      version: tool.version,
      useCount: 0,
      lastUsed: undefined,
      averageExecutionTime: 0
    };
    
    // Register configuration schema if provided
    if (configSchema) {
      configManager.registerToolConfig(tool.name, configSchema, defaultConfig);
      
      // Listen for configuration validation errors
      configManager.on(ConfigEventType.CONFIG_VALIDATION_ERROR, (data) => {
        if (data.toolName === tool.name) {
          this.emit(ToolEventType.CONFIG_VALIDATION_ERROR, {
            type: ToolEventType.CONFIG_VALIDATION_ERROR,
            toolName: tool.name,
            timestamp: new Date().toISOString(),
            details: data.errors
          } as ToolEvent);
        }
      });
      
      // Listen for configuration updates
      configManager.on(ConfigEventType.CONFIG_UPDATED, (data) => {
        if (data.toolName === tool.name) {
          this.emit(ToolEventType.CONFIGURATION_CHANGED, {
            type: ToolEventType.CONFIGURATION_CHANGED,
            toolName: tool.name,
            timestamp: new Date().toISOString(),
            details: data
          } as ToolEvent);
        }
      });
    }
    
    // Emit registration event
    this.emit(ToolEventType.REGISTERED, {
      type: ToolEventType.REGISTERED,
      toolName: tool.name,
      timestamp: new Date().toISOString(),
      details: this.toolMetadata[tool.name]
    } as ToolEvent);
    
    console.log(`Registered tool: ${tool.name}`);
    return true;
  }
  
  /**
   * Unregister a tool from the manager
   * 
   * @param toolName Name of the tool to unregister
   * @returns boolean indicating if unregistration was successful
   */
  unregisterTool(toolName: string): boolean {
    if (this.tools[toolName]) {
      const metadata = this.toolMetadata[toolName];
      delete this.tools[toolName];
      delete this.toolMetadata[toolName];
      
      // Reset tool configuration if exists
      if (configManager.getToolConfigSchema(toolName)) {
        configManager.resetToolConfig(toolName);
      }
      
      // Emit unregistration event
      this.emit(ToolEventType.UNREGISTERED, {
        type: ToolEventType.UNREGISTERED,
        toolName: toolName,
        timestamp: new Date().toISOString(),
        details: metadata
      } as ToolEvent);
      
      console.log(`Unregistered tool: ${toolName}`);
      return true;
    } else {
      console.warn(`Tool not found: ${toolName}`);
      return false;
    }
  }
  
  /**
   * Get all available tools
   * 
   * @returns Record of all registered tools
   */
  getAvailableTools(): ToolRegistry {
    return { ...this.tools };
  }
  
  /**
   * Get metadata for all registered tools
   * 
   * @returns Record of tool metadata
   */
  getAllToolMetadata(): Record<string, ToolMetadata> {
    return { ...this.toolMetadata };
  }
  
  /**
   * Get metadata for a specific tool
   * 
   * @param toolName Name of the tool
   * @returns Tool metadata or undefined if not found
   */
  getToolMetadata(toolName: string): ToolMetadata | undefined {
    return this.toolMetadata[toolName];
  }
  
  /**
   * Check if a tool is registered
   * 
   * @param toolName Name of the tool to check
   * @returns Boolean indicating if the tool is registered
   */
  hasTool(toolName: string): boolean {
    return !!this.tools[toolName];
  }
  
  /**
   * Use a specific tool with provided parameters
   * 
   * @param toolName Name of the tool to use
   * @param params Parameters for the tool
   * @param context Optional context information
   * @param options Optional execution options
   * @returns Result of the tool execution
   */
  async useTool(toolName: string, params: any, context?: any, options?: ExecutionOptions): Promise<ToolOutput> {
    const tool = this.tools[toolName];
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    // Get tool configuration if available
    const toolConfig = configManager.getToolConfig(toolName);
    
    // Record execution start time for metadata update
    const startTime = Date.now();
    
    try {
      // Merge params with configuration if not explicitly provided in params
      const mergedParams = { ...toolConfig, ...params };
      
      // Use the execution framework to execute the tool
      const result = await this.executionFramework.execute(tool, mergedParams, context, options);
      
      // Update tool metadata
      this.updateToolExecutionMetrics(toolName, Date.now() - startTime, result.success);
      
      return result;
    } catch (error) {
      // Update tool metadata for failed execution
      this.updateToolExecutionMetrics(toolName, Date.now() - startTime, false);
      
      console.error(`Error executing tool ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      };
    }
  }
  
  /**
   * Execute multiple tools in parallel
   * 
   * @param toolsConfig Map of tool names to parameters
   * @param options Parallel execution options
   * @returns Combined execution result
   */
  async useMultipleTools(
    toolsConfig: Record<string, { params: any; context?: any; options?: ExecutionOptions; dependencies?: string[] }>,
    options?: ParallelExecutionOptions
  ): Promise<ParallelExecutionResult> {
    // Build execution plan
    const executionPlan: Record<string, any> = {};
    
    for (const [toolName, config] of Object.entries(toolsConfig)) {
      const tool = this.tools[toolName];
      
      if (!tool) {
        console.warn(`Tool not found: ${toolName}`);
        continue;
      }
      
      executionPlan[toolName] = {
        tool,
        params: config.params,
        context: config.context,
        options: config.options,
        dependencies: config.dependencies
      };
    }
    
    // Execute in parallel
    const result = await this.parallelExecutor.executeParallel(executionPlan, options);
    
    // Update tool metadata for all executed tools
    for (const [toolName, toolResult] of Object.entries(result.results)) {
      if (this.tools[toolName]) {
        this.updateToolExecutionMetrics(
          toolName,
          result.stats.totalTimeMs / Object.keys(result.results).length, // Approximate execution time
          toolResult.success
        );
      }
    }
    
    return result;
  }
  
  /**
   * Select appropriate tools based on task description
   * 
   * @param taskDescription Description of the task
   * @returns Array of tool names that are suitable for the task
   */
  selectToolsForTask(taskDescription: string): string[] {
    // This is a more sophisticated implementation
    const toolMatches: Array<{ name: string; score: number }> = [];
    
    // Score each tool based on various factors
    for (const [name, tool] of Object.entries(this.tools)) {
      const metadata = this.toolMetadata[name];
      
      // Match capabilities by checking if any capabilities are mentioned in the task
      const matchedCapabilities = metadata.capabilities.filter(capability => 
        taskDescription.toLowerCase().includes(capability.toLowerCase())
      );
      
      // Match by keywords in description
      const descriptionKeywords = metadata.description.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3); // Only consider words with more than 3 characters
      
      const matchedKeywords = descriptionKeywords.filter(word => 
        taskDescription.toLowerCase().includes(word)
      );
      
      // Match by tool name
      const nameMatch = taskDescription.toLowerCase().includes(name.toLowerCase());
      
      // Match by tags if available
      const matchedTags = (metadata.tags || []).filter(tag => 
        taskDescription.toLowerCase().includes(tag.toLowerCase())
      );
      
      // Calculate score based on matches
      let score = 0;
      // Capability matches are most important
      score += matchedCapabilities.length * 2;
      // Keyword matches from description
      score += matchedKeywords.length * 0.5;
      // Name match is a strong signal
      if (nameMatch) score += 2;
      // Tag matches
      score += matchedTags.length * 1;
      
      toolMatches.push({ name, score });
    }
    
    // Sort by score (descending) and return tools with score > 0
    return toolMatches
      .filter(match => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(match => match.name);
  }
  
  /**
   * Get the execution framework
   * 
   * @returns The execution framework
   */
  getExecutionFramework(): ToolExecutionFramework {
    return this.executionFramework;
  }
  
  /**
   * Get the parallel executor
   * 
   * @returns The parallel executor
   */
  getParallelExecutor(): ParallelExecutor {
    return this.parallelExecutor;
  }
  
  /**
   * Register execution hooks for all tool operations
   * 
   * @param hooks The hooks to register
   */
  registerExecutionHooks(hooks: ExecutionHooks): void {
    this.executionFramework.registerGlobalHooks(hooks);
  }
  
  /**
   * Update tool metadata with tags or additional metadata
   * 
   * @param toolName Name of the tool to update
   * @param tags Optional array of tags to assign
   * @param additionalMetadata Optional additional metadata to store
   * @returns Boolean indicating if update was successful
   */
  updateToolMetadata(
    toolName: string, 
    tags?: string[], 
    additionalMetadata?: Record<string, any>
  ): boolean {
    if (!this.tools[toolName]) {
      return false;
    }
    
    if (tags) {
      this.toolMetadata[toolName].tags = tags;
    }
    
    if (additionalMetadata) {
      this.toolMetadata[toolName].additionalMetadata = {
        ...this.toolMetadata[toolName].additionalMetadata,
        ...additionalMetadata
      };
    }
    
    return true;
  }
  
  /**
   * Forward events from the execution framework to the tools manager
   */
  private forwardExecutionEvents(): void {
    // Forward all execution events
    this.executionFramework.on(ToolExecutionEvent.EXECUTION_START, (data) => {
      this.emit(ToolEventType.EXECUTED, {
        type: ToolEventType.EXECUTED,
        toolName: data.toolName,
        timestamp: new Date().toISOString(),
        details: data
      });
    });
    
    this.executionFramework.on(ToolExecutionEvent.EXECUTION_ERROR, (data) => {
      this.emit(ToolEventType.EXECUTION_FAILED, {
        type: ToolEventType.EXECUTION_FAILED,
        toolName: data.toolName,
        timestamp: new Date().toISOString(),
        details: data
      });
    });
  }
  
  /**
   * Validate that a tool implements the required interface
   * 
   * @param tool Tool to validate
   * @returns Boolean indicating if the tool is valid
   */
  private validateToolInterface(tool: BaseTool): boolean {
    // Check for required properties
    if (!tool.name || !tool.description || !Array.isArray(tool.capabilities) || !tool.version) {
      return false;
    }
    
    // Check for required methods
    if (typeof tool.execute !== 'function') {
      return false;
    }
    
    return true;
  }
  
  /**
   * Update metrics for tool execution
   * 
   * @param toolName Name of the tool
   * @param executionTime Time taken for execution in ms
   * @param success Whether execution was successful
   */
  private updateToolExecutionMetrics(
    toolName: string, 
    executionTime: number, 
    success: boolean
  ): void {
    const metadata = this.toolMetadata[toolName];
    if (!metadata) return;
    
    // Update last used timestamp
    metadata.lastUsed = new Date();
    
    // Increment use count
    metadata.useCount = (metadata.useCount || 0) + 1;
    
    // Calculate running average execution time
    if (metadata.averageExecutionTime === undefined) {
      metadata.averageExecutionTime = executionTime;
    } else {
      // Running average formula: newAvg = oldAvg + (newValue - oldAvg) / count
      metadata.averageExecutionTime += (executionTime - metadata.averageExecutionTime) / metadata.useCount;
    }
  }
  
  /**
   * Register default tools with the manager
   */
  /**
   * Get tool configuration
   * 
   * @param toolName Name of the tool
   * @returns Configuration object for the tool
   */
  getToolConfig(toolName: string): Record<string, any> {
    return configManager.getToolConfig(toolName);
  }
  
  /**
   * Set tool configuration
   * 
   * @param toolName Name of the tool
   * @param config Configuration object to set
   * @returns Boolean indicating if configuration was successfully applied
   */
  setToolConfig(toolName: string, config: Record<string, any>): boolean {
    // Check if the tool exists
    if (!this.tools[toolName]) {
      console.error(`Tool not found: ${toolName}`);
      return false;
    }
    
    // Update the configuration
    return configManager.updateToolConfig(toolName, config);
  }
  
  /**
   * Reset tool configuration to defaults
   * 
   * @param toolName Name of the tool
   * @returns Boolean indicating if reset was successful
   */
  resetToolConfig(toolName: string): boolean {
    // Check if the tool exists
    if (!this.tools[toolName]) {
      console.error(`Tool not found: ${toolName}`);
      return false;
    }
    
    // Reset the configuration
    return configManager.resetToolConfig(toolName);
  }
  
  /**
   * Get configuration validation errors for a tool
   * 
   * @param toolName Name of the tool
   * @returns Array of validation errors
   */
  getToolConfigValidationErrors(toolName: string): any[] {
    return configManager.getValidationErrors(toolName);
  }
  
  /**
   * Generate configuration documentation for a tool
   * 
   * @param toolName Name of the tool
   * @returns Formatted documentation string
   */
  getToolConfigDocumentation(toolName: string): string {
    return configManager.generateConfigDocumentation(toolName);
  }
  
  /**
   * Save all tool configurations to a file
   * 
   * @param filePath Path to save configuration file
   * @returns Boolean indicating if save was successful
   */
  saveToolConfigurations(filePath?: string): boolean {
    return configManager.saveConfigToFile(filePath);
  }
  
  /**
   * Load tool configurations from a file
   * 
   * @param filePath Path to load configuration file from
   * @returns Boolean indicating if load was successful
   */
  loadToolConfigurations(filePath: string): boolean {
    return configManager.loadConfigFromFile(filePath);
  }
  
  private registerDefaultTools(): void {
    // Register all default tools with their configuration schemas
    
    // VectorSearch configuration
    this.registerTool(new VectorSearch(), {
      properties: {
        indexName: {
          type: 'string',
          description: 'Name of the vector index to search',
          default: 'default'
        },
        similarityThreshold: {
          type: 'number',
          description: 'Minimum similarity score (0.0 to 1.0) for results',
          default: 0.7
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return',
          default: 10
        },
        includeMetadata: {
          type: 'boolean',
          description: 'Whether to include metadata in results',
          default: true
        },
        model: {
          type: 'string',
          description: 'Embedding model to use',
          default: 'text-embedding-ada-002'
        }
      },
      required: ['indexName']
    });
    
    // TextGeneration configuration
    this.registerTool(new TextGeneration(), {
      properties: {
        model: {
          type: 'string',
          description: 'LLM model to use for generation',
          default: 'gpt-4'
        },
        temperature: {
          type: 'number',
          description: 'Temperature for generation (0.0 to 1.0)',
          default: 0.7
        },
        maxTokens: {
          type: 'number',
          description: 'Maximum number of tokens to generate',
          default: 1000
        },
        topP: {
          type: 'number',
          description: 'Top-p sampling parameter',
          default: 1.0
        },
        stopSequences: {
          type: 'array',
          description: 'Sequences that will stop generation',
          default: []
        }
      },
      required: ['model']
    });
    
    // CodeExecutor configuration
    this.registerTool(new CodeExecutor(), {
      properties: {
        timeout: {
          type: 'number',
          description: 'Execution timeout in milliseconds',
          default: 5000
        },
        maxMemoryMB: {
          type: 'number',
          description: 'Maximum memory usage in MB',
          default: 512
        },
        allowedLanguages: {
          type: 'array',
          description: 'List of allowed languages to execute',
          default: ['javascript', 'python', 'typescript']
        },
        securitySandboxing: {
          type: 'boolean',
          description: 'Whether to use security sandboxing',
          default: true
        }
      }
    });
    
    // WebBrowser configuration
    this.registerTool(new WebBrowser(), {
      properties: {
        timeout: {
          type: 'number',
          description: 'Request timeout in milliseconds',
          default: 10000
        },
        userAgent: {
          type: 'string',
          description: 'User agent string for requests',
          default: 'Mozilla/5.0 AgentNexus/1.0'
        },
        maxContentSizeKB: {
          type: 'number',
          description: 'Maximum content size in KB',
          default: 5120
        },
        followRedirects: {
          type: 'boolean',
          description: 'Whether to follow redirects',
          default: true
        },
        maxRedirects: {
          type: 'number',
          description: 'Maximum number of redirects to follow',
          default: 5
        }
      }
    });
    
    // Note: Additional tools will be registered as they are implemented
  }
}