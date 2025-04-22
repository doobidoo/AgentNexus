# Claude Code Integration for Project Nexus

This document provides a quick reference for Project Nexus developers on how the repository has been structured to work effectively with Claude Code.

## Directory Structure

```
Project Root
├── .claude.md                        # Root-level Claude guidance
├── .claude/                          # Claude configuration
│   └── commands/                     # Custom slash commands
│       ├── fix-issue.md              # Fix GitHub issues
│       └── implement-feature.md      # Implement new features
├── docs/
│   ├── instructions/                 # Development workflow docs
│   ├── standards/                    # Component standards
│   └── claude/                       # Claude-specific guidance
│       ├── project.claude.md         # Project-wide guidance
│       ├── memory-system.claude.md   # Memory system guidance
│       ├── planning-system.claude.md # Planning system guidance
│       ├── action-system.claude.md   # Action system guidance
│       ├── tool-system.claude.md     # Tool system guidance
│       ├── web-automation.claude.md  # Web automation guidance
│       ├── visual-elements.claude.md # Visual element handling
│       ├── github-integration.claude.md     # GitHub workflows
│       ├── slash-commands.claude.md  # Slash command system
│       ├── headless-mode.claude.md   # Automation guidance
│       └── multi-claude-workflows.claude.md # Multi-Claude patterns
└── src/
    └── core/
        ├── action/                   # Action system
        │   └── .claude/              # Action-specific guidance
        ├── memory/                   # Memory system
        │   └── .claude/              # Memory-specific guidance
        ├── planning/                 # Planning system
        │   └── .claude/              # Planning-specific guidance
        └── tools/                    # Tool system
            └── .claude/              # Tool-specific guidance
```

## Quick Reference

### Key Claude Integration Files

| File | Purpose |
|------|---------|
| `.claude.md` | Root-level guidance for all Claude sessions |
| `docs/claude/project.claude.md` | Detailed project-wide guidance |
| `docs/claude/[component].claude.md` | Component-specific guidance |
| `src/core/*/claude/README.md` | Implementation-specific guidance |

### Custom Slash Commands

| Command | Purpose |
|---------|---------|
| `/project:fix-issue <number>` | Fix a GitHub issue |
| `/project:implement-feature <desc>` | Implement a new feature |

### Development Workflow Integration

1. **Session Initialization**:
   - Review project status with `nexus-status`
   - Explore relevant documentation
   - Check component standards with `nexus-standards [component]`

2. **Task Planning**:
   - Break down complex tasks
   - Identify affected components
   - Reference relevant Claude guidance files

3. **Implementation**:
   - Follow patterns in component Claude files
   - Use appropriate prompting techniques
   - Leverage visual elements when needed

4. **Review and Documentation**:
   - Request Claude's review of changes
   - Update documentation as needed
   - Prepare GitHub PRs and commit messages

5. **Session Completion**:
   - Store session summary in memory
   - Update task status
   - Plan next steps

## Best Practices Alignment

This integration follows Claude Code best practices:

### 1. Customized Setup

- **CLAUDE.md files** at multiple levels:
  - Root level for project-wide guidance
  - Component level for specific implementation patterns
  - Code directories for implementation details
- **Content organization** with consistent structure:
  - Component overviews
  - Architecture diagrams
  - Implementation patterns
  - Common tasks

### 2. Tools Integration

- **Command system** for accessing project information
- **Custom slash commands** for common workflows
- **GitHub integration** for repository operations

### 3. Workflow Patterns

- **Explore, plan, code, commit** workflow documented
- **Test-driven development** patterns established
- **Visual element handling** processes defined

### 4. Advanced Capabilities

- **Visual feedback loop** process for UI development
- **Headless mode** integration for automation
- **Multi-Claude workflows** for complex tasks

## Getting Started

1. **Explore Project Structure**:
   ```bash
   # View top-level structure
   ls -la
   
   # View Claude guidance files
   ls -la docs/claude/
   
   # View component guidance
   ls -la src/core/memory/.claude/
   ```

2. **Review Key Documentation**:
   - Start with the root `.claude.md` file
   - Review component standards relevant to your task
   - Check component-specific Claude guidance

3. **Use the Command System**:
   ```
   nexus-status
   nexus-standards memory
   ```

4. **Leverage Custom Slash Commands**:
   ```
   /project:fix-issue 123
   /project:implement-feature memory consolidation
   ```

5. **Follow Development Workflow**:
   - See `docs/instructions/DEVELOPMENT_WORKFLOW_IMPROVED.md`
   - Follow session structure and best practices

## Additional Resources

- Claude Code documentation: https://claude.ai/code
- Anthropic's Claude Code best practices: https://www.anthropic.com/engineering/claude-code-best-practices
- Project Nexus standards: see `/docs/standards/`