# Project Nexus Development Workflow

This document outlines the instruction-based development approach used with Project Nexus.

## Instruction System Overview

Project Nexus uses a modular, instruction-based development approach that integrates with Claude and MCP tools. The development workflow is structured through:

1. **Core Prompt** - A streamlined instruction set for regular sessions
2. **Component Standards** - Detailed guidelines for each system stored in the repository
3. **Command System** - Structured commands for accessing project information

## Using the Command System

The Project Nexus command system provides structured access to project components:

- `nexus-status`: Review overall project status and priorities
- `nexus-continue`: Continue highest priority task from previous session
- `nexus-standards [component]`: Access detailed standards (memory, planning, action, tools, web)
- `nexus-memory-system`, `nexus-planning`, etc.: Focus on specific system development

## Component Standards

Each component in Project Nexus follows detailed standards documented in the `/docs/standards/` directory:

- **Memory System**: Architecture, types, operations, and integration patterns
- **Planning System**: Methodologies, representations, and execution strategies
- **Action System**: Component structure, lifecycle, and error handling
- **Tool System**: Management, discovery, and execution framework
- **Web Automation**: Playwright implementation with page object pattern

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
```

### 2. Task Selection and Planning

- Identify the highest priority task
- Break down complex tasks into manageable steps
- Map out dependencies and prerequisites
- Create new tasks as needed

### 3. Implementation

- Read existing code to understand context
- Write and edit files using file system functions
- Follow established coding standards (TypeScript with OOP principles)
- Organize code according to project structure

### 4. Testing

- Write unit tests concurrently with implementation
- Ensure comprehensive testing of new functionality
- Verify integration with existing components

### 5. Documentation

- Add JSDoc comments to all code
- Update README files as needed
- Document APIs and interfaces

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

## Getting Started

1. Review the Project Nexus Core Prompt
2. Explore the component standards in `/docs/standards/`
3. Use the command system to navigate the project
4. Follow the development workflow for consistent progress