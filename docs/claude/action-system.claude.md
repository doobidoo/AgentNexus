# Action System - Claude AI Guidance

## Component Overview

The Action System translates agent plans into executable operations, manages tool invocation, handles response processing, and provides feedback mechanisms for the planning system.

## Architecture

```
Action System
├── ActionExecutor
├── ToolInvoker
├── ResponseHandler
├── FeedbackCollector
└── ActionTypes
    ├── ToolAction
    ├── CommunicationAction
    ├── InternalAction
    └── CompositeAction
```

## Key Files

- `/src/core/action/index.ts`: Main exports and types
- `/src/core/action/execution.ts`: Action execution engine
- `/src/core/action/feedback.ts`: Feedback collection mechanisms

## Implementation Patterns

### Action Interface

```typescript
export interface IAction {
  id: string;
  type: ActionType;
  description: string;
  parameters: Record<string, any>;
  dependencies?: string[];
  constraints?: ActionConstraint[];
  
  execute(context: ExecutionContext): Promise<ActionResult>;
  validate(context: ExecutionContext): Promise<ValidationResult>;
  getEstimatedCost(): ActionCost;
}
```

### Tool Action Implementation

```typescript
export class ToolAction implements IAction {
  id: string;
  type: ActionType.Tool;
  description: string;
  parameters: Record<string, any>;
  dependencies?: string[];
  constraints?: ActionConstraint[];
  
  constructor(
    private readonly toolName: string,
    private readonly toolRegistry: ToolRegistry,
    actionConfig: ToolActionConfig
  ) {
    this.id = actionConfig.id || generateUniqueId();
    this.description = actionConfig.description;
    this.parameters = actionConfig.parameters;
    this.dependencies = actionConfig.dependencies;
    this.constraints = actionConfig.constraints;
  }
  
  async execute(context: ExecutionContext): Promise<ActionResult> {
    try {
      const tool = this.toolRegistry.getTool(this.toolName);
      
      if (!tool) {
        throw new ActionError(`Tool '${this.toolName}' not found`);
      }
      
      const validationResult = await this.validate(context);
      if (!validationResult.isValid) {
        throw new ActionError(`Invalid action: ${validationResult.reason}`);
      }
      
      const result = await tool.execute(this.parameters, context);
      return {
        success: true,
        actionId: this.id,
        output: result,
        metadata: {
          executionTime: Date.now(),
          toolName: this.toolName
        }
      };
    } catch (error) {
      return {
        success: false,
        actionId: this.id,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          executionTime: Date.now(),
          toolName: this.toolName
        }
      };
    }
  }
  
  async validate(context: ExecutionContext): Promise<ValidationResult> {
    // Implementation
  }
  
  getEstimatedCost(): ActionCost {
    // Implementation
  }
}
```

### Action Executor

```typescript
export class ActionExecutor {
  constructor(
    private readonly toolRegistry: ToolRegistry,
    private readonly config: ActionExecutorConfig
  ) {}
  
  async executeAction(action: IAction, context: ExecutionContext): Promise<ActionResult> {
    try {
      // Pre-execution hooks
      await this.runPreExecutionHooks(action, context);
      
      // Execute the action
      const result = await action.execute(context);
      
      // Post-execution hooks
      await this.runPostExecutionHooks(action, result, context);
      
      return result;
    } catch (error) {
      // Error handling
      await this.handleExecutionError(action, error, context);
      
      return {
        success: false,
        actionId: action.id,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: {
          executionTime: Date.now()
        }
      };
    }
  }
  
  // Additional methods...
}
```

## Implementation Guidelines

1. **Action Types**:
   - Implement each action type as a separate class
   - Use consistent interfaces across all action types
   - Support composition of actions
   - Document action type behaviors and constraints

2. **Execution Management**:
   - Implement pre and post-execution hooks
   - Support execution timeout and cancellation
   - Provide detailed execution traces
   - Handle error states gracefully

3. **Validation**:
   - Validate actions before execution
   - Check parameter types and constraints
   - Verify dependencies are satisfied
   - Support custom validation rules

4. **Feedback**:
   - Collect execution metrics
   - Provide standardized feedback format
   - Support structured and free-form feedback
   - Ensure feedback is stored in memory system

## Common Tasks

### Adding a New Action Type

1. Create a class implementing the IAction interface
2. Define unique action type identifier
3. Implement execution and validation logic
4. Add support in ActionExecutor
5. Document the new action type's behavior

### Enhancing Execution Monitoring

1. Define key metrics for execution monitoring
2. Implement collection points throughout execution
3. Create standardized reporting format
4. Add visualization or analysis tools
5. Store monitoring data for analysis

### Implementing Action Composition

1. Define composition patterns (sequence, parallel, conditional)
2. Implement CompositeAction class
3. Handle dependency management
4. Support partial success scenarios
5. Provide composite action visualization

## Error Handling

```typescript
// Custom error classes
export class ActionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ActionError';
  }
}

export class ValidationError extends ActionError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ValidationError';
  }
}

export class ExecutionError extends ActionError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ExecutionError';
  }
}

// Error handling approach
try {
  // Action execution
} catch (error) {
  if (error instanceof ValidationError) {
    // Handle validation error
  } else if (error instanceof ExecutionError) {
    // Handle execution error
  } else {
    // Handle unexpected error
    throw new ActionError('Unexpected error during action execution', { cause: error });
  }
}
```

## Testing Approach

1. Unit test each action type in isolation
2. Use mock tools for testing tool actions
3. Test action composition patterns
4. Verify error handling pathways
5. Test performance under various loads

## Additional Resources

- See `/docs/standards/action-system.md` for complete specifications
- Review existing implementations in `/src/core/action/`
- Study feedback patterns for improving action success rates