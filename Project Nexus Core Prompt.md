# Project Nexus Core Prompt

## Project Overview

Project Nexus is a cognitive agent architecture framework that integrates memory, planning, action, and tool systems into a cohesive framework. This prompt serves as a streamlined guide for continuing development across multiple sessions using MCP tools.

**Repository Location:** /Users/hkr/Documents/GitHub/AgentNexus/

## Command System

### Core Commands

- `nexus-status`: Review overall project status, current priorities, and next steps
- `nexus-continue`: Continue highest priority task from previous session 
- `nexus-standards [component]`: Access detailed standards for a specific component:
  - `nexus-standards memory`: Memory system standards
  - `nexus-standards planning`: Planning system standards
  - `nexus-standards action`: Action system standards
  - `nexus-standards tools`: Tool system standards
  - `nexus-standards web`: Web automation standards

### System-Specific Commands

- `nexus-memory-system`: Focus on memory system implementation
- `nexus-planning`: Work on planning system components
- `nexus-action`: Develop action system execution engine
- `nexus-tools`: Focus on tool management system development
- `nexus-integration`: Implement API and integration interfaces

### File and Repository Commands

- `nexus-file read [path]`: Read a file from the repository
- `nexus-file write [path] [content]`: Create or update a file
- `nexus-file edit [path] [edits]`: Edit an existing file
- `nexus-file search [pattern]`: Search for files in the repository

## Development Workflow

### 1. Session Initialization

```
# Review previous work
recall_memory {
  query: "last session on Project Nexus",
  n_results: 3
}

# Check current tasks
read_file "/Users/hkr/Documents/GitHub/AgentNexus/tasks/tasks.json"

# Review project structure if needed
directory_tree "/Users/hkr/Documents/GitHub/AgentNexus/src"
```

### 2. Task Selection and Planning

- Identify the highest priority task from tasks.json
- Break down complex tasks into manageable steps
- Map out dependencies and prerequisites
- Update tasks.json as needed for new tasks

### 3. Implementation

- Read existing code to understand context
- Write and edit files using file system functions
- Follow established coding standards (TypeScript with OOP principles)
- Organize code according to project structure:
  - Core components in /src/core/
  - System-specific modules in respective folders (/memory/, /planning/, etc.)

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

2. Update task status in tasks.json:
   ```
   edit_file "/Users/hkr/Documents/GitHub/AgentNexus/tasks/tasks.json" [updates to status field]
   ```

3. Prepare a commit message (provide in a code block for easy copying):
   ```
   git commit -m "feat(component): Brief description
   
   - Detail point 1
   - Detail point 2
   - Detail point 3
   
   Resolves #issue_number"
   ```

4. Identify next steps and update tasks.json accordingly:
   ```
   edit_file "/Users/hkr/Documents/GitHub/AgentNexus/tasks/tasks.json" [add new task or update future tasks]
   ```

## Coding Standards Reference

- Use TypeScript with strict typing
- Follow OOP principles with interfaces and abstract classes
- Implement comprehensive error handling and logging
- Create modular components with clear responsibilities
- Write pure functions where possible
- Use dependency injection for testability
- Implement async/await for asynchronous operations

## Project Structure

- /src/core/ - Core framework components
  - /memory/ - Memory system implementation
  - /planning/ - Planning system components
  - /action/ - Action execution engine
  - /tools/ - Tool management system
  - /integration/ - API and external integrations
- /tests/ - Test suites
- /docs/ - Documentation
  - /standards/ - Detailed standard documents

For detailed standards on specific components, use `nexus-standards [component]` command to access the comprehensive guidelines stored in the repository.