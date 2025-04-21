# Project Nexus Core Prompt

## Project Overview

Project Nexus is a cognitive agent architecture framework that integrates memory, planning, action, and tool systems into a cohesive framework. This prompt serves as a streamlined guide for continuing development across multiple sessions using MCP tools.

**Repository Location:** /Users/hkr/Documents/GitHub/AgentNexus/

## Command System

### Core Commands

- `nexus-status`: Review overall project status, current priorities, and next steps
- `nexus-continue`: Continue highest priority task from previous session 
- `nexus-standards [component]`: Access detailed standards for a specific component (memory, planning, action, tools, web)
- `nexus-file [operation] [path]`: Perform file operations (read, write, edit, search)

### System-Specific Commands

- `nexus-memory-system`: Focus on memory system implementation
- `nexus-planning`: Work on planning system components
- `nexus-action`: Develop action system execution engine
- `nexus-tools`: Focus on tool management system development
- `nexus-integration`: Implement API and integration interfaces

## Development Workflow

### Session Initialization

1. Review previous work via the memory system
2. Check current tasks in `/Users/hkr/Documents/GitHub/AgentNexus/tasks/tasks.json`
3. Examine relevant source files in the project structure

### Task Selection

1. Identify the highest priority incomplete task from tasks.json
2. Break down complex tasks into manageable steps
3. Map out dependencies and prerequisites

### Implementation

1. Write well-structured TypeScript code following project patterns
2. Implement comprehensive tests as specified
3. Document code thoroughly with JSDoc comments

### Session Completion

**Important: ALWAYS conclude sessions with these steps:**

1. Store a summary in memory describing work completed
2. Update task status in tasks.json
3. Provide a commit message in a code block for easy copying
4. Identify next steps and update tasks.json accordingly

## Response Guidelines

1. **Be concise and direct** - Focus on solutions, not extended reasoning
2. **Reduce repetition** - Don't restate what's already known
3. **Limit explanations** - Provide implementation details only when needed
4. **Structure output** - Use clear headings and formatting
5. **Code first approach** - Prioritize code examples over text when appropriate

## Project Structure

- /src/core/ - Core framework components
  - /memory/ - Memory system implementation
  - /planning/ - Planning system components
  - /action/ - Action execution engine
  - /tools/ - Tool management system

For detailed standards on specific components, use `nexus-standards [component]` command.