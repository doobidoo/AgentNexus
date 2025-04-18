/**
 * Tools Manager for Agent Nexus
 * 
 * Provides a standardized tool interface and management system
 * that enables dynamic tool selection based on task requirements.
 */

import { BaseTool, ToolInput, ToolOutput } from './base';
import { VectorSearch } from './vector-search';
import { TextGeneration } from './text-generation';
import { CodeExecutor } from './code-executor';
import { WebBrowser } from './web-browser';

// Tool registry type
export type ToolRegistry = Record<string, BaseTool>;

export class ToolsManager {
  private tools: ToolRegistry;
  
  constructor() {
    // Initialize with empty registry
    this.tools = {};
    
    // Register default tools
    this.registerDefaultTools();
  }
  
  /**
   * Register a tool with the manager
   * 
   * @param tool The tool to register
   */
  registerTool(tool: BaseTool): void {
    this.tools[tool.name] = tool;
    console.log(`Registered tool: ${tool.name}`);
  }
  
  /**
   * Unregister a tool from the manager
   * 
   * @param toolName Name of the tool to unregister
   */
  unregisterTool(toolName: string): void {
    if (this.tools[toolName]) {
      delete this.tools[toolName];
      console.log(`Unregistered tool: ${toolName}`);
    } else {
      console.warn(`Tool not found: ${toolName}`);
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
   * @returns Result of the tool execution
   */
  async useTool(toolName: string, params: any): Promise<ToolOutput> {
    const tool = this.tools[toolName];
    
    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }
    
    // Prepare standardized input
    const input: ToolInput = {
      params,
      timestamp: new Date().toISOString(),
      requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    };
    
    try {
      // Execute the tool
      const result = await tool.execute(input);
      return result;
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: input.requestId
      };
    }
  }
  
  /**
   * Select appropriate tools based on task description
   * 
   * @param taskDescription Description of the task
   * @returns Array of tool names that are suitable for the task
   */
  selectToolsForTask(taskDescription: string): string[] {
    // This is a simplified implementation
    // In a real system, this would use more sophisticated matching
    
    const toolMatches: Array<{ name: string; score: number }> = [];
    
    // Score each tool based on its description and capabilities
    for (const [name, tool] of Object.entries(this.tools)) {
      const descriptionMatch = tool.description.toLowerCase().split(' ').some(
        word => taskDescription.toLowerCase().includes(word)
      );
      
      const capabilityMatch = tool.capabilities.some(capability => 
        taskDescription.toLowerCase().includes(capability.toLowerCase())
      );
      
      let score = 0;
      if (descriptionMatch) score += 0.5;
      if (capabilityMatch) score += 1;
      
      toolMatches.push({ name, score });
    }
    
    // Sort by score and return tools with score > 0
    return toolMatches
      .filter(match => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(match => match.name);
  }
  
  /**
   * Register default tools with the manager
   */
  private registerDefaultTools(): void {
    // Register all default tools
    this.registerTool(new VectorSearch());
    this.registerTool(new TextGeneration());
    this.registerTool(new CodeExecutor());
    this.registerTool(new WebBrowser());
    
    // Note: Additional tools will be registered as they are implemented
  }
}
