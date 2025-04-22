# Claude AI Integration Guide for Project Nexus

This guide explains how Project Nexus integrates Claude AI for development assistance using a structured approach based on Claude Code best practices.

## Instruction Files Architecture

Project Nexus uses a hierarchical structure of Claude instruction files:

1. **Root Level**:
   - `/.claude.md`: Project-wide overview and general guidance
   - `/docs/instructions/DEVELOPMENT_WORKFLOW.md`: Development workflow details

2. **Documentation Level**:
   - `/docs/claude/project.claude.md`: Project-wide detailed guidance
   - `/docs/claude/[component-name].claude.md`: Component-specific guidance
   - `/docs/standards/[component-name].md`: Detailed implementation standards

3. **Code Level**:
   - `/src/core/[component]/claude/README.md`: Implementation-specific guidance

## Claude Integration Best Practices

The Project Nexus Claude integration follows these best practices:

### 1. Clear Contextual Hierarchy

- Each component has dedicated guidance files at different levels of detail
- Files use consistent formatting and structure
- Component-specific guidance references standards documents

### 2. Standardized Command System

- `nexus-*` commands provide standardized access to project information
- Commands integrate with memory system for consistent access
- Command responses follow predictable formats

### 3. Documentation-Driven Development

- Standards documents define implementation requirements
- Claude guidance documents explain implementation patterns
- Component READMEs provide quick reference for common tasks

### 4. Consistent File Structure

Each Claude guidance file follows a consistent structure:
- Component overview
- Architecture diagram
- Key files reference
- Implementation patterns
- Common tasks
- Error handling approaches
- Testing strategies

### 5. Progressive Disclosure

- Root-level file provides general project context
- Component-level files add detailed implementation guidance
- Code-level files focus on specific implementation patterns
- Standards documents provide comprehensive specifications

## How to Use Claude for Development

### Session Structure

1. **Session Initialization**:
   - Review project status and task priorities
   - Explore relevant documentation and standards
   - Understand existing implementation patterns

2. **Task Planning**:
   - Break complex tasks into concrete steps
   - Identify dependencies and relevant components
   - Create explicit acceptance criteria

3. **Implementation**:
   - Reference relevant Claude guidance files
   - Follow established implementation patterns
   - Maintain consistency with project standards

4. **Testing and Documentation**:
   - Write comprehensive tests
   - Document public interfaces and behaviors
   - Update relevant standards or guidance

5. **Session Completion**:
   - Store session summaries in memory
   - Update task status
   - Prepare commit messages
   - Identify next steps

### Effective Prompting Techniques

For optimal Claude assistance:

1. **Include Context**:
   ```
   nexus-standards memory
   
   I'm working on enhancing the vector retrieval capabilities in 
   /src/core/memory/vector-store.ts to support semantic filters.
   ```

2. **Reference Existing Patterns**:
   ```
   The current implementation in /src/core/memory/long-term.ts 
   handles basic storage. I need to extend this to support the 
   memory consolidation pattern described in the memory system 
   standards.
   ```

3. **Request Specific Guidance**:
   ```
   Please help me implement a new RetrievalStrategy class that 
   follows the pattern in /src/core/memory/index.ts and conforms
   to the IMemoryRetrieval interface.
   ```

4. **Iterate Incrementally**:
   ```
   I've implemented the basic structure for the ConsolidationManager.
   Now I need to add the algorithm for identifying similar memories
   based on embedding similarity.
   ```

## Maintaining Claude Guidance Files

Claude guidance files should be updated when:
- Adding major new features or components
- Changing architectural patterns
- Discovering better implementation approaches
- Adding new development workflows

When updating guidance files:
1. Maintain consistent formatting
2. Update all relevant levels of documentation
3. Include practical examples of new patterns
4. Reference existing standards documents

## Example Development Session

```
# Session start
nexus-status
nexus-standards memory

# Exploring current implementation
list_directory "/Users/hkr/Documents/GitHub/AgentNexus/src/core/memory"
read_file "/Users/hkr/Documents/GitHub/AgentNexus/src/core/memory/index.ts"

# Understanding requirements
read_file "/Users/hkr/Documents/GitHub/AgentNexus/docs/standards/memory-system.md"

# Implementing new features
# (Implementation steps...)

# Session completion
store_memory {
  content: "Session summary: Implemented memory consolidation feature with similarity detection",
  metadata: {
    tags: "session-summary,memory-system,consolidation",
    type: "summary"
  }
}

complete_todo "Implement memory consolidation"

# Next steps
add_todo "Add tests for memory consolidation" "later"
```