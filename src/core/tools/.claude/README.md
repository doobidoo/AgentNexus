# Tool System Development Guide

This directory contains guidance specific to the tool system implementation. For detailed implementation standards, refer to:

- Complete standards: `/docs/standards/tool-system.md`
- Claude guidance: `/docs/claude/tool-system.claude.md`

## Quick Reference

### Key Interfaces

- `ITool`: Interface for all tools
- `IToolRegistry`: Interface for tool registration and discovery
- `IExecutionContext`: Interface for execution context
- `IToolSelector`: Interface for intelligent tool selection

### Implementation Files

- `index.ts`: Main exports and types
- `base.ts`: Base tool classes and interfaces
- `execution-context.ts`: Execution context management
- `parallel-executor.ts`: Parallel tool execution
- `code-executor.ts`: Code execution capability
- `rag.ts`: Retrieval-augmented generation
- `vector-search.ts`: Vector search capabilities
- `web-browser.ts`: Web browsing capabilities
- `text-generation.ts`: Text generation utilities
- `config-manager.ts`: Tool configuration management
- `tool-selection.ts`: Intelligent tool selection

### Common Tasks

1. Creating a new tool
2. Implementing tool selection logic
3. Extending execution context capabilities
4. Adding parameter validation

## Implementation Patterns

Sample implementation patterns can be found in the Claude guidance file. For component-specific questions, include `nexus-standards tools` in your prompt to Claude.