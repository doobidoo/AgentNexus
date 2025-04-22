# Project Nexus - Claude AI Guidance

## Project Overview

Project Nexus is a sophisticated AI agent framework built with TypeScript that integrates multiple AI systems:

- **Memory System**: Vector-based storage and retrieval for agent experiences
- **Planning System**: Multi-strategy planning capabilities for task execution
- **Action System**: Tool execution and response handling framework
- **Tool System**: Extensible tools for agent capabilities
- **Web Automation**: Browser automation integration

## Architecture Principles

1. **Modular Design**: Each system is independently maintained and versioned
2. **Clear Interfaces**: Well-defined contracts between components
3. **Type Safety**: Comprehensive TypeScript typing throughout
4. **Error Handling**: Consistent error management patterns
5. **Documentation**: JSDoc comments on all public interfaces

## Development Standards

### Code Organization

- **Core Systems**: Located in `/src/core/` with subdirectories by component
- **API Layer**: Interface definitions in `/src/api/`
- **Client Components**: React components in `/src/components/`
- **Documentation**: Standards in `/docs/standards/` and Claude guidance in `/docs/claude/`

### TypeScript Conventions

- Use explicit typing for all public interfaces
- Prefer interfaces over types for public contracts
- Use generics for reusable components
- Document all public methods with JSDoc
- Follow consistent naming conventions:
  - Interfaces: `IMemoryStore`, `IPlanningStrategy`
  - Abstract classes: `BaseModel`, `BaseTool`
  - Implementation classes: `ChromaVectorStore`, `OpenAIModel`

### Implementation Patterns

1. **Dependency Injection**:
   ```typescript
   // Preferred pattern
   class MemoryManager {
     constructor(
       private readonly store: IMemoryStore,
       private readonly retriever: IMemoryRetriever
     ) {}
   }
   ```

2. **Async/Await**:
   ```typescript
   // Preferred pattern
   async retrieve(query: string): Promise<SearchResult[]> {
     try {
       const results = await this.store.search(query);
       return results.map(this.formatResult);
     } catch (error) {
       this.logger.error('Retrieval failed', error);
       throw new MemoryError('Failed to retrieve memories', { cause: error });
     }
   }
   ```

3. **Error Handling**:
   ```typescript
   // Use custom error classes
   export class MemoryError extends Error {
     constructor(message: string, options?: ErrorOptions) {
       super(message, options);
       this.name = 'MemoryError';
     }
   }
   
   // Handle errors consistently
   try {
     // Operation
   } catch (error) {
     if (error instanceof MemoryError) {
       // Handle known error
     } else {
       // Log and wrap unknown errors
       throw new MemoryError('Operation failed', { cause: error });
     }
   }
   ```

## How To Use This File

This file serves as a high-level guide for Claude AI when assisting with Project Nexus development. When working on specific components, refer to the component-specific `.claude.md` files in their respective directories.

For implementation assistance:
1. Refer to the standards documents in `/docs/standards/`
2. Check component-specific Claude guidance
3. Follow the established patterns documented here
4. Maintain consistency with existing implementations

## Common Development Tasks

### Adding New Tools

1. Create a new class that extends `BaseTool`
2. Implement the required interface methods
3. Register the tool in the tool registry
4. Add comprehensive unit tests
5. Document usage patterns

### Extending Memory Capabilities

1. Review the memory system architecture
2. Identify the appropriate extension point
3. Implement new features following established patterns
4. Update memory system documentation
5. Add integration tests for new features

### Implementing Planning Strategies

1. Create a new class implementing `IPlanningStrategy`
2. Follow the planning system architecture
3. Integrate with existing reflection mechanisms
4. Document the strategy's behavior and constraints
5. Test with various agent tasks

## Example Guidance Requests

When asking Claude for assistance, use specific guidance formats like:

```
nexus-standards memory

I need help implementing a new MemoryRetrieval strategy that combines semantic 
and keyword search. The implementation should follow the patterns in 
/src/core/memory/vector-store.ts and integrate with the existing MemoryManager.
```

Or:

```
I need to extend the Planning System to support multi-agent coordination. 
Please help me design the interfaces following the standards in the planning 
system documentation, with a focus on maintaining the existing reflection 
capabilities.
```