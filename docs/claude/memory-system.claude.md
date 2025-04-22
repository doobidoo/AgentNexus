# Memory System - Claude AI Guidance

## Component Overview

The Memory System provides persistent storage and retrieval of agent experiences, knowledge, and context. It serves as the foundation for agent continuity and learning.

## Architecture

```
MemoryManager (orchestration)
├── MemoryStore (storage)
│   ├── ChromaDBClient
│   └── VectorStore
├── MemoryRetrieval (retrieval)
│   ├── SemanticSearch
│   └── KeywordSearch
├── MemoryIndex (indexing)
└── MemoryTypes
    ├── Episodic
    ├── Semantic
    ├── Procedural
    ├── Working
    └── Associative
```

## Key Files

- `/src/core/memory/index.ts`: Main exports and types
- `/src/core/memory/long-term.ts`: Persistent memory implementation
- `/src/core/memory/short-term.ts`: Working memory implementation
- `/src/core/memory/vector-store.ts`: Vector database integration
- `/src/core/memory/chromadb-client.ts`: ChromaDB implementation

## Implementation Patterns

### Memory Storage

```typescript
// Example memory storage pattern
export class MemoryStore implements IMemoryStore {
  constructor(
    private readonly vectorStore: VectorStore,
    private readonly config: MemoryConfig
  ) {}

  async store(memory: Memory): Promise<string> {
    try {
      const embedding = await this.getEmbedding(memory.content);
      const id = generateUniqueId();
      
      await this.vectorStore.insert({
        id,
        embedding,
        metadata: memory.metadata,
        content: memory.content
      });
      
      return id;
    } catch (error) {
      throw new MemoryError('Failed to store memory', { cause: error });
    }
  }
  
  // Other methods...
}
```

### Memory Retrieval

```typescript
// Example retrieval pattern
export class MemoryRetrieval implements IMemoryRetrieval {
  constructor(
    private readonly vectorStore: VectorStore,
    private readonly config: RetrievalConfig
  ) {}

  async retrieveSimilar(query: string, options: RetrievalOptions): Promise<Memory[]> {
    try {
      const embedding = await this.getEmbedding(query);
      const results = await this.vectorStore.search({
        embedding,
        limit: options.limit || this.config.defaultLimit,
        filters: options.filters
      });
      
      return results.map(this.mapToMemory);
    } catch (error) {
      throw new MemoryError('Failed to retrieve memories', { cause: error });
    }
  }
  
  // Other methods...
}
```

### Memory Types

Each memory type follows a consistent structure:

```typescript
export interface EpisodicMemory extends BaseMemory {
  type: 'episodic';
  timestamp: string;
  context: {
    environment: string;
    actors: string[];
    actions: Action[];
  };
  sequence: string[];
}
```

## Implementation Guidelines

1. **Vector Store Integration**:
   - Use standard embedding dimensions (1536)
   - Implement caching for frequent operations
   - Support batch operations for efficiency
   - Handle errors with specific MemoryError types

2. **Memory Operations**:
   - Implement CRUD operations consistently
   - Support filtering and sorting in retrieval
   - Use pagination for large result sets
   - Maintain proper transaction boundaries

3. **Memory Types**:
   - Follow standard schemas for each type
   - Implement type-specific validation
   - Use consistent serialization approaches
   - Support cross-type memory relationships

4. **Error Handling**:
   - Use custom MemoryError class for all errors
   - Include underlying cause when wrapping errors
   - Implement graceful degradation for partial failures
   - Log detailed error information for diagnosis

## Common Tasks

### Adding a New Memory Type

1. Define the interface extending BaseMemory
2. Implement storage and retrieval methods
3. Add type-specific validation rules
4. Create serialization/deserialization helpers
5. Update memory manager to support the type

### Implementing New Retrieval Strategy

1. Create strategy class implementing IMemoryRetrieval
2. Configure appropriate index structures
3. Optimize for the retrieval pattern
4. Add filtering and sorting capabilities
5. Test with various query patterns

### Extending Storage Capabilities

1. Identify extension points in IMemoryStore
2. Implement new storage methods
3. Update memory manager to leverage new capabilities
4. Add migration utilities if schema changes
5. Document new storage patterns

## MCP Function Examples

```typescript
// Storing memory with tags
store_memory({
  content: "Implementation details: The memory indexing system uses a B-tree structure with order 5...",
  metadata: {
    tags: "memory-system,indexing,b-tree,implementation",
    type: "technical"
  }
});

// Retrieving memories by semantic search
retrieve_memory({
  query: "B-tree implementation details",
  n_results: 5
});

// Time-based memory retrieval
recall_memory({
  query: "what did we work on last session",
  n_results: 3
});
```

## Testing Approach

1. Unit test each memory component in isolation
2. Use mock vector stores for testing
3. Test edge cases like empty results and errors
4. Verify memory lifecycle operations
5. Benchmark performance for optimization

## Additional Resources

- See `/docs/standards/memory-system.md` for complete specifications
- Review existing implementations in `/src/core/memory/`
- Reference vector database documentation for optimization