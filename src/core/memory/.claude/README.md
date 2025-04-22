# Memory System Development Guide

This directory contains guidance specific to the memory system implementation. For detailed implementation standards, refer to:

- Complete standards: `/docs/standards/memory-system.md`
- Claude guidance: `/docs/claude/memory-system.claude.md`

## Quick Reference

### Key Interfaces

- `IMemoryStore`: Interface for persistent storage
- `IMemoryRetrieval`: Interface for memory retrieval operations
- `IMemoryIndex`: Interface for indexing operations
- `IMemoryManager`: Central orchestration interface

### Implementation Files

- `index.ts`: Main exports and types
- `long-term.ts`: Persistent memory implementation
- `short-term.ts`: Working memory implementation
- `vector-store.ts`: Vector database integration
- `chromadb-client.ts`: ChromaDB implementation

### Common Tasks

1. Adding a new memory type
2. Implementing new retrieval strategies
3. Extending storage capabilities
4. Optimizing vector search

## Implementation Patterns

Sample implementation patterns can be found in the Claude guidance file. For component-specific questions, include `nexus-standards memory` in your prompt to Claude.
