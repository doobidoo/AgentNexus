# Project Nexus Development Workflow

This document outlines the instruction-based development approach used with Project Nexus, integrating Claude AI assistance for streamlined development.

## Instruction System Overview

Project Nexus uses a modular, instruction-based development approach that integrates with Claude and MCP tools. The development workflow is structured through:

1. **Core Prompts** - Streamlined instruction sets for regular development sessions
2. **Component Standards** - Detailed guidelines for each system stored in the repository
3. **Command System** - Structured commands for accessing project information
4. **Claude Instructions** - Component-specific guidance in dedicated `.claude.md` files

## Using the Command System

The Project Nexus command system provides structured access to project components:

| Command | Purpose |
|---------|---------|
| `nexus-status` | Review overall project status and priorities |
| `nexus-continue` | Continue highest priority task from previous session |
| `nexus-standards [component]` | Access detailed standards (memory, planning, action, tools, web) |
| `nexus-memory-system`, `nexus-planning`, etc. | Focus on specific system development |

## Component Standards

Each component in Project Nexus follows detailed standards documented in the `/docs/standards/` directory:

| Component | Standards Focus |
|-----------|----------------|
| **Memory System** | Architecture, types, operations, and integration patterns |
| **Planning System** | Methodologies, representations, and execution strategies |
| **Action System** | Component structure, lifecycle, and error handling |
| **Tool System** | Management, discovery, and execution framework |
| **Web Automation** | Playwright implementation with page object pattern |

## Claude AI Integration

Project Nexus leverages Claude's capabilities using best practices:

1. **Component-Specific `.claude.md` Files** - Each major component has a dedicated instruction file that provides:
   - Component architecture overview
   - Implementation guidelines
   - Existing patterns and conventions
   - Common challenges and solutions

2. **Instruction Hierarchy**:
   - Project-level instructions in `/docs/claude/project.claude.md`
   - Component-level instructions in respective directories
   - Task-specific instructions for complex implementations

3. **Contextual Awareness**:
   - Claude can access relevant component standards via `nexus-standards` command
   - Instruction files use consistent formatting for easier navigation
   - Key code examples highlight preferred implementation patterns

## Development Workflow

### 1. Session Initialization

```
# Review previous work
recall_memory {
  query: "last session on Project Nexus",
  n_results: 3
}

# Check current tasks
show_all_todos

# Review project structure if needed
directory_tree "/Users/hkr/Documents/GitHub/AgentNexus/src"

# Access component standards if needed
nexus-standards memory
```

### 2. Task Selection and Planning

1. **Identify priorities**:
   - Review highest priority task
   - Check dependencies and blockers
   - Ensure all requirements are clear

2. **Task breakdown**:
   - Decompose complex tasks into concrete steps
   - Identify clear completion criteria for each step
   - Document assumptions and constraints

3. **Resource identification**:
   - Determine required components and interfaces
   - Review relevant `.claude.md` files for component guidance
   - Reference existing implementation patterns

### 3. Implementation

1. **Contextual understanding**:
   - Read existing code to understand context
   - Check component standards for architectural guidance
   - Review related `.claude.md` files for specific patterns

2. **Code development**:
   - Follow established project conventions (TypeScript with OOP principles)
   - Implement features with consistent error handling
   - Add comprehensive type definitions
   - Document public APIs with JSDoc comments

3. **Component integration**:
   - Follow established interface contracts
   - Maintain loose coupling between components
   - Implement proper dependency injection

### 4. Testing

- Write unit tests concurrently with implementation
- Ensure comprehensive coverage of key workflows
- Include edge cases and error conditions
- Verify integration with existing components

### 5. Documentation

- Add JSDoc comments to all public interfaces
- Update README files for modified components
- Document APIs and interface changes
- Update `.claude.md` files with new patterns if needed

### 6. Session Completion

**Important: ALWAYS conclude sessions with these steps:**

1. Summarize the work accomplished:
   ```
   store_memory {
     content: "Session summary: [Brief description of work done]",
     metadata: {
       tags: "session-summary,[relevant-tags]",
       type: "summary"
     }
   }
   ```

2. Update task status:
   ```
   complete_todo "[task_id]"
   ```

3. Prepare a commit message (provide in a code block for easy copying):
   ```
   git commit -m "feat(component): Brief description
   
   - Detail point 1
   - Detail point 2
   - Detail point 3
   
   Resolves #issue_number"
   ```

4. Identify next steps:
   ```
   add_todo "Next task description" "later"
   ```

## Working with Claude

### Effective Claude Prompting

1. **Provide clear context**:
   - Reference relevant component standards
   - Specify target file paths
   - Include relevant existing code

2. **Use specific instructions**:
   - Request implementation following specific patterns
   - Reference existing implementation examples
   - Specify error handling requirements

3. **Break down complex requests**:
   - Focus on one component at a time
   - Build incrementally with clear steps
   - Request focused code reviews

### Using Claude for Code Navigation

Claude can help navigate the codebase:
- Request directory structure exploration
- Ask for finding specific implementation patterns
- Get help understanding component relationships

### Using Claude for Implementation

For optimal implementation assistance:
- Provide clear specifications tied to standards
- Reference existing patterns to maintain consistency
- Request implementations that follow project conventions

## Getting Started

1. Review the Project Nexus Core Prompt
2. Explore the component standards in `/docs/standards/`
3. Review component-specific `.claude.md` files
4. Use the command system to navigate the project
5. Follow the development workflow for consistent progress