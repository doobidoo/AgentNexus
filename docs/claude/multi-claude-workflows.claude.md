# Multi-Claude Workflows - Claude AI Guidance

## Overview

Multi-Claude workflows involve using multiple Claude instances in parallel to accomplish complex tasks more efficiently. This approach leverages separation of concerns, isolated contexts, and parallel processing to enhance development productivity.

## Workflow Patterns

### 1. Write-Review-Improve Pattern

This pattern uses separate Claude instances for implementation, review, and refinement:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Claude #1   │     │ Claude #2   │     │ Claude #3   │
│ Implementer │────▶│ Reviewer    │────▶│ Refiner     │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │                   │
     ▼                    ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Initial     │     │ Review      │     │ Refined     │
│ Code        │     │ Comments    │     │ Code        │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Implementation:**
1. **Terminal 1 (Implementer)**: 
   - Start Claude with implementation focus
   - Provide requirements and context
   - Ask to write initial implementation
   - Save output to a file or commit to a branch

2. **Terminal 2 (Reviewer)**:
   - Start a new Claude instance
   - Provide the implementation from Terminal 1
   - Ask for a thorough code review
   - Save review comments to a file

3. **Terminal 3 (Refiner)**:
   - Start another Claude instance
   - Provide both the implementation and review comments
   - Ask to refine the code based on feedback
   - Commit the final version

**Key Benefits:**
- Each Claude instance has a focused role
- Review is more objective with a clean context
- Final refinement considers both implementation and critique

### 2. Multiple Checkout Parallelization

This pattern uses separate repositories or branches for parallel tasks:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Checkout #1 │     │ Checkout #2 │     │ Checkout #3 │
│ Feature A   │     │ Feature B   │     │ Bug Fix C   │
└─────────────┘     └─────────────┘     └─────────────┘
     │                    │                   │
     ▼                    ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Claude #1   │     │ Claude #2   │     │ Claude #3   │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Implementation:**
1. **Create Multiple Checkouts**:
   ```bash
   # Clone repository to different directories
   git clone https://github.com/username/project.git project-feature-a
   git clone https://github.com/username/project.git project-feature-b
   git clone https://github.com/username/project.git project-bugfix-c
   
   # Create branches in each
   cd project-feature-a && git checkout -b feature-a
   cd ../project-feature-b && git checkout -b feature-b
   cd ../project-bugfix-c && git checkout -b bugfix-c
   ```

2. **Run Claude in Each Directory**:
   - Open separate terminals for each checkout
   - Run `claude` in each directory
   - Assign different tasks to each instance

3. **Merge Results**:
   - Create PRs from each branch
   - Review and merge changes

**Key Benefits:**
- Fully isolated environments
- No context pollution between tasks
- Maximum parallelization

### 3. Git Worktree Approach

This pattern uses git worktrees for a more efficient multi-branch workflow:

```
┌─────────────────────────────────────────────────────┐
│ Main Repository                                     │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│ │ Worktree #1 │  │ Worktree #2 │  │ Worktree #3 │  │
│ │ Feature A   │  │ Feature B   │  │ Bug Fix C   │  │
│ └─────────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────┘
       │               │                │
       ▼               ▼                ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Claude #1   │  │ Claude #2   │  │ Claude #3   │
└─────────────┘  └─────────────┘  └─────────────┘
```

**Implementation:**
1. **Create Worktrees**:
   ```bash
   # Create worktrees for different tasks
   git worktree add ../project-feature-a feature-a
   git worktree add ../project-feature-b feature-b
   git worktree add ../project-bugfix-c bugfix-c
   ```

2. **Run Claude in Each Worktree**:
   - Open separate terminals for each worktree
   - Run `claude` in each directory
   - Assign distinct tasks to each instance

3. **Clean Up When Done**:
   ```bash
   git worktree remove ../project-feature-a
   git worktree remove ../project-feature-b
   git worktree remove ../project-bugfix-c
   ```

**Key Benefits:**
- Shared Git objects (more efficient than full clones)
- Isolated working directories
- Easier branch management

### 4. Scratchpad Communication Pattern

This pattern enables Claude instances to communicate through shared files:

```
┌─────────────┐                       ┌─────────────┐
│ Claude #1   │                       │ Claude #2   │
│ Researcher  │◄──────Queries────────▶│ Implementer │
└─────────────┘                       └─────────────┘
      │                                      │
      │                                      │
      ▼                                      ▼
┌─────────────┐                       ┌─────────────┐
│ research-   │                       │ implement-  │
│ notes.md    │◄──Cross-reference────▶│ ation.md    │
└─────────────┘                       └─────────────┘
```

**Implementation:**
1. **Create Shared Files**:
   ```bash
   touch research-notes.md implementation.md
   ```

2. **Run Claude Instances with Different Roles**:
   - **Terminal 1 (Researcher)**:
     ```
     claude
     
     # Then in Claude:
     Your role is to research the memory system architecture and document your findings.
     Write your research notes to research-notes.md.
     If you have questions about how to implement something, note them clearly.
     Periodically check implementation.md to see if your questions have been answered.
     ```
   
   - **Terminal 2 (Implementer)**:
     ```
     claude
     
     # Then in Claude:
     Your role is to implement the memory system based on research.
     Write your implementation to implementation.md.
     Periodically check research-notes.md for questions and update your implementation.
     If you need more information, add specific questions to implementation.md.
     ```

3. **Coordinate Updates**:
   - Periodically tell each Claude to check the other file
   - Help resolve communication blocks if needed

**Key Benefits:**
- Specialized roles with focused context
- Asynchronous communication through files
- Documented research and implementation process

## Setting Up Multi-Claude Environments

### Terminal Setup

For optimal multi-Claude workflows:

1. **Use Terminal Multiplexer**:
   - tmux or screen for multiple sessions
   - iTerm2 split panes on macOS
   - Windows Terminal tabs on Windows

2. **Session Naming**:
   ```bash
   # For tmux
   tmux new-session -s claude-implementation
   tmux new-session -s claude-review
   tmux new-session -s claude-refinement
   
   # Switch between sessions
   tmux switch-client -t claude-implementation
   ```

3. **Visual Differentiation**:
   - Use different terminal colors or themes
   - Add session name to prompt
   - Use window/tab titles

### Notifications

Set up notifications for when Claude needs attention:

1. **iTerm2 on macOS**:
   - Enable "Silence bell" and "Flash visual bell"
   - Use "Notify when idle" feature

2. **Custom Scripts**:
   ```bash
   # Simple notification when Claude needs input
   claude | while read line; do
     if [[ "$line" == *"Your input:"* ]]; then
       osascript -e 'display notification "Claude needs input" with title "Claude"'
     fi
     echo "$line"
   done
   ```

### IDE Integration

For effective multi-Claude development:

1. **VS Code Workspaces**:
   - Create a workspace for each Claude task
   - Use different color themes
   - Keep relevant files in workspace

2. **Editor Configuration**:
   ```json
   // .vscode/settings.json for Feature A
   {
     "workbench.colorTheme": "Default Light+",
     "window.title": "${rootName} - Feature A"
   }
   
   // .vscode/settings.json for Feature B
   {
     "workbench.colorTheme": "Default Dark+",
     "window.title": "${rootName} - Feature B"
   }
   ```

## Multi-Claude Workflow Patterns

### 1. Component Division

Divide work by component or system:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Claude #1   │     │ Claude #2   │     │ Claude #3   │
│ Memory      │     │ Planning    │     │ Action      │
│ System      │     │ System      │     │ System      │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Instructions to Claude:**
```
You're focusing on the Memory System component.
Your task is to implement the memory consolidation feature.
Don't worry about Planning or Action systems - other Claude
instances are handling those components.
```

### 2. Layer Division

Divide work by architectural layer:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Claude #1   │     │ Claude #2   │     │ Claude #3   │
│ Data Models │     │ Business    │     │ API/UI      │
│             │     │ Logic       │     │ Layer       │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Instructions to Claude:**
```
You're working on the data models for the memory system.
Focus only on defining the interfaces, types, and classes
needed for data representation. Don't implement business logic
or API endpoints - other Claude instances will handle those.
```

### 3. Task Division

Divide work by development task type:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Claude #1   │     │ Claude #2   │     │ Claude #3   │
│ Feature     │     │ Testing     │     │ Document-   │
│ Development │     │             │     │ ation       │
└─────────────┘     └─────────────┘     └─────────────┘
```

**Instructions to Claude:**
```
Your role is to write comprehensive tests for the memory system.
Another Claude instance is implementing the feature code.
Focus on creating unit tests, integration tests, and test utilities.
Include edge cases and failure scenarios in your test coverage.
```

## Coordination Strategies

### 1. File-Based Coordination

Use shared files for cross-Claude communication:

```bash
# Create coordination files
touch .claude-coordination/status.md
touch .claude-coordination/questions.md
touch .claude-coordination/answers.md
```

Tell each Claude about the coordination system:
```
Please check .claude-coordination/questions.md periodically for
questions from other Claude instances. If you see a question related
to your task, write your answer to .claude-coordination/answers.md.

Update your progress in .claude-coordination/status.md every time you
complete a significant step.
```

### 2. Pull Request Based Coordination

Use GitHub PRs for coordination:

1. Each Claude creates a PR for its work
2. Other Claude instances review the PRs
3. Use PR comments for cross-Claude communication

### 3. Issue-Based Coordination

Use GitHub issues as coordination points:

1. Create a master issue describing the overall task
2. Create sub-issues for each Claude instance
3. Each Claude updates its issue with progress
4. Use issue comments for questions and answers

## Best Practices

1. **Clear Role Definition**:
   - Give each Claude a specific, non-overlapping responsibility
   - Provide clear boundaries between tasks
   - Document dependencies between Claude instances

2. **Communication Protocol**:
   - Establish standard formats for cross-Claude communication
   - Create predictable update intervals
   - Use structured formats (e.g., JSON, YAML) for machine-parsable updates

3. **Context Management**:
   - Keep each Claude's context focused on its specific task
   - Periodically use `/clear` to refresh context
   - Avoid overwhelming Claude with irrelevant information

4. **Conflict Resolution**:
   - Establish clear conflict resolution strategies
   - Define how to handle overlapping changes
   - Document merge procedures

5. **Progress Tracking**:
   - Implement consistent progress reporting across instances
   - Create dashboards or status pages
   - Use structured logging

## Example Multi-Claude Workflow

### Feature Implementation with TDD

**Terminal 1 (Test Writer)**:
```bash
cd project-memory-system-tests
claude
```

Instructions to Claude:
```
Your job is to write tests for the memory consolidation feature.
The requirements are:
1. The system should detect similar memories
2. It should merge memories with >80% semantic similarity
3. It should maintain timestamps of merged memories

Write these tests to tests/memory/consolidation.test.ts
DO NOT implement the actual feature, only the tests.
```

**Terminal 2 (Implementer)**:
```bash
cd project-memory-system-impl
claude
```

Instructions to Claude:
```
Your job is to implement the memory consolidation feature.
Another Claude instance has written tests at
../project-memory-system-tests/tests/memory/consolidation.test.ts

Please look at these tests and implement the feature to pass them.
Focus on creating the memory/consolidation.ts file and integrating
it with the rest of the system.
```

**Terminal 3 (Reviewer)**:
```bash
cd project-memory-system-review
claude
```

Instructions to Claude:
```
Your job is to review both the tests and implementation for the
memory consolidation feature.

Tests: ../project-memory-system-tests/tests/memory/consolidation.test.ts
Implementation: ../project-memory-system-impl/src/core/memory/consolidation.ts

Provide a detailed code review with suggestions for improvements.
Focus on test coverage, edge cases, performance, and error handling.
```

## Troubleshooting Multi-Claude Workflows

### Common Issues and Solutions

1. **Inconsistent Understanding**:
   - Issue: Different Claude instances interpret requirements differently
   - Solution: Create a shared requirements document that all instances reference

2. **Duplicated Work**:
   - Issue: Multiple Claude instances implement the same functionality
   - Solution: Clearly define boundaries and check for overlap

3. **Integration Problems**:
   - Issue: Components built by different Claude instances don't work together
   - Solution: Define clear interfaces upfront and create integration tests

4. **Context Limitations**:
   - Issue: Claude instances lack visibility into each other's work
   - Solution: Use file sharing and structured updates

5. **Synchronization Issues**:
   - Issue: One Claude is waiting for another to complete a dependency
   - Solution: Implement checkpoint files and notifications