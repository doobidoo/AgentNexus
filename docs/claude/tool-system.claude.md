# Tool System - Claude AI Guidance

## Component Overview

The Tool System provides a standardized framework for defining, discovering, and executing external capabilities. It enables agents to interact with APIs, execute code, search for information, and manipulate data through a consistent interface.

## Architecture

```
Tool System
├── ToolRegistry
├── ToolDiscovery
├── ToolExecution
│   ├── ParallelExecutor
│   └── ExecutionContext
├── ToolTypes
│   ├── CodeExecutor
│   ├── RAGTool
│   ├── VectorSearch
│   ├── WebBrowser
│   └── TextGeneration
└── ConfigManager
```

## Key Files

- `/src/core/tools/index.ts`: Main exports and types
- `/src/core/tools/base.ts`: Base tool classes and interfaces
- `/src/core/tools/execution-context.ts`: Execution context management
- `/src/core/tools/parallel-executor.ts`: Parallel tool execution
- `/src/core/tools/code-executor.ts`: Code execution capability
- `/src/core/tools/rag.ts`: Retrieval-augmented generation
- `/src/core/tools/vector-search.ts`: Vector search capabilities
- `/src/core/tools/web-browser.ts`: Web browsing capabilities
- `/src/core/tools/text-generation.ts`: Text generation utilities
- `/src/core/tools/config-manager.ts`: Tool configuration management
- `/src/core/tools/tool-selection.ts`: Intelligent tool selection

## Implementation Patterns

### Base Tool Interface

```typescript
export interface ITool {
  name: string;
  description: string;
  version: string;
  parameters: ToolParameter[];
  requiredCapabilities: Capability[];
  
  execute(params: Record<string, any>, context: ExecutionContext): Promise<ToolResult>;
  validateParams(params: Record<string, any>): ValidationResult;
  getUsageExample(): string;
  estimateCost(params: Record<string, any>): ToolCost;
}
```

### Base Tool Implementation

```typescript
export abstract class BaseTool implements ITool {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly version: string,
    public readonly parameters: ToolParameter[],
    public readonly requiredCapabilities: Capability[] = []
  ) {}
  
  abstract execute(params: Record<string, any>, context: ExecutionContext): Promise<ToolResult>;
  
  validateParams(params: Record<string, any>): ValidationResult {
    const missingParams = this.parameters
      .filter(param => param.required)
      .filter(param => !(param.name in params));
      
    if (missingParams.length > 0) {
      return {
        isValid: false,
        reason: `Missing required parameters: ${missingParams.map(p => p.name).join(', ')}`
      };
    }
    
    // Additional validation...
    
    return { isValid: true };
  }
  
  getUsageExample(): string {
    // Implementation
  }
  
  estimateCost(params: Record<string, any>): ToolCost {
    // Implementation
  }
}
```

### Tool Registry

```typescript
export class ToolRegistry {
  private tools: Map<string, ITool> = new Map();
  
  constructor(
    private readonly config: ToolRegistryConfig
  ) {}
  
  registerTool(tool: ITool): void {
    if (this.tools.has(tool.name)) {
      throw new ToolError(`Tool with name '${tool.name}' is already registered`);
    }
    
    this.tools.set(tool.name, tool);
  }
  
  getTool(name: string): ITool | undefined {
    return this.tools.get(name);
  }
  
  getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }
  
  findToolsByCapability(capability: Capability): ITool[] {
    return this.getAllTools().filter(tool => 
      tool.requiredCapabilities.includes(capability)
    );
  }
  
  // Additional methods...
}
```

### Tool Execution Context

```typescript
export class ExecutionContext {
  constructor(
    public readonly sessionId: string,
    public readonly userId: string,
    private readonly storage: Map<string, any> = new Map(),
    public readonly capabilities: Capability[] = [],
    public readonly parent?: ExecutionContext
  ) {}
  
  hasCapability(capability: Capability): boolean {
    return this.capabilities.includes(capability);
  }
  
  getData<T>(key: string): T | undefined {
    if (this.storage.has(key)) {
      return this.storage.get(key) as T;
    }
    
    if (this.parent) {
      return this.parent.getData<T>(key);
    }
    
    return undefined;
  }
  
  setData<T>(key: string, value: T): void {
    this.storage.set(key, value);
  }
  
  // Additional methods...
}
```

## Implementation Guidelines

1. **Tool Definition**:
   - Use clear, concise tool names and descriptions
   - Document all parameters thoroughly
   - Specify required capabilities explicitly
   - Include usage examples for all tools

2. **Parameter Validation**:
   - Validate all parameters before execution
   - Provide clear error messages for invalid parameters
   - Support type conversion where appropriate
   - Document parameter constraints

3. **Error Handling**:
   - Use custom ToolError classes for all errors
   - Include underlying cause when wrapping errors
   - Provide helpful error messages for debugging
   - Log detailed error information for diagnostics

4. **Tool Discovery**:
   - Implement dynamic tool registration
   - Support capability-based tool discovery
   - Provide tool metadata for intelligent selection
   - Document discovery mechanisms

## Common Tasks

### Adding a New Tool

1. Create a class extending BaseTool
2. Define parameters and required capabilities
3. Implement execution logic
4. Add documentation and usage examples
5. Register with ToolRegistry

```typescript
export class WeatherTool extends BaseTool {
  constructor() {
    super(
      'weather',
      'Get current weather information for a location',
      '1.0.0',
      [
        {
          name: 'location',
          description: 'Location to get weather for',
          type: 'string',
          required: true
        },
        {
          name: 'units',
          description: 'Temperature units (celsius or fahrenheit)',
          type: 'string',
          required: false,
          defaultValue: 'celsius'
        }
      ],
      [Capability.ExternalAPIAccess]
    );
  }
  
  async execute(params: Record<string, any>, context: ExecutionContext): Promise<ToolResult> {
    try {
      const { location, units = 'celsius' } = params;
      
      // Implementation...
      
      return {
        success: true,
        data: weatherData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
}
```

### Implementing Tool Selection

1. Define tool selection criteria
2. Implement selection algorithm
3. Support context-based selection
4. Add history-based optimization
5. Document selection behavior

### Enhancing Execution Context

1. Define additional context data requirements
2. Implement new context methods
3. Update tool implementations to use new context
4. Document context usage patterns
5. Add testing for context functionality

## Error Handling

```typescript
// Custom error classes
export class ToolError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ToolError';
  }
}

export class ToolExecutionError extends ToolError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ToolExecutionError';
  }
}

export class ToolValidationError extends ToolError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ToolValidationError';
  }
}

// Error handling approach
try {
  // Tool execution
} catch (error) {
  if (error instanceof ToolValidationError) {
    // Handle validation error
  } else if (error instanceof ToolExecutionError) {
    // Handle execution error
  } else {
    // Handle unexpected error
    throw new ToolError('Unexpected error during tool execution', { cause: error });
  }
}
```

## Testing Approach

1. Unit test each tool in isolation
2. Use mock APIs for external services
3. Test parameter validation thoroughly
4. Verify error handling pathways
5. Test tool discovery and selection

## Additional Resources

- See `/docs/standards/tool-system.md` for complete specifications
- Review existing tool implementations in `/src/core/tools/`
- Study usage patterns in successful agent executions