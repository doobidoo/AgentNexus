/**
 * Base Tool Interface for Agent Nexus
 * 
 * Defines the standard interface that all tools must implement
 * to ensure consistency across the tool ecosystem.
 */

export interface ToolInput {
  params: any;
  timestamp: string;
  requestId: string;
  context?: any;
}

export interface ToolOutput {
  success: boolean;
  result?: any;
  error?: string;
  timestamp: string;
  requestId: string;
  metadata?: Record<string, any>;
}

export interface BaseTool {
  name: string;
  description: string;
  capabilities: string[];
  version: string;
  execute(input: ToolInput): Promise<ToolOutput>;
  validate?(input: ToolInput): boolean | Promise<boolean>;
  getMetadata?(): Record<string, any>;
}

export abstract class AbstractTool implements BaseTool {
  name: string;
  description: string;
  capabilities: string[];
  version: string;
  
  constructor(name: string, description: string, capabilities: string[], version = '1.0.0') {
    this.name = name;
    this.description = description;
    this.capabilities = capabilities;
    this.version = version;
  }
  
  /**
   * Execute the tool with the provided input
   * This method must be implemented by each tool
   * 
   * @param input Tool input parameters and context
   */
  abstract execute(input: ToolInput): Promise<ToolOutput>;
  
  /**
   * Validate the input parameters
   * 
   * @param input Tool input to validate
   * @returns Boolean indicating if the input is valid
   */
  validate(input: ToolInput): boolean {
    // Basic validation - can be overridden by specific tools
    return !!input && !!input.params;
  }
  
  /**
   * Get metadata about the tool
   * 
   * @returns Object containing tool metadata
   */
  getMetadata(): Record<string, any> {
    return {
      name: this.name,
      description: this.description,
      capabilities: this.capabilities,
      version: this.version
    };
  }
  
  /**
   * Create a standardized success response
   * 
   * @param result The result data
   * @param input The original input for context
   * @returns A properly formatted success output
   */
  protected createSuccessOutput(result: any, input: ToolInput): ToolOutput {
    return {
      success: true,
      result,
      timestamp: new Date().toISOString(),
      requestId: input.requestId
    };
  }
  
  /**
   * Create a standardized error response
   * 
   * @param error The error message or object
   * @param input The original input for context
   * @returns A properly formatted error output
   */
  protected createErrorOutput(error: string | Error, input: ToolInput): ToolOutput {
    return {
      success: false,
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString(),
      requestId: input.requestId
    };
  }
}
