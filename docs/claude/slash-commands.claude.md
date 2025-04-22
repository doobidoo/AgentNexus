# Custom Slash Commands - Claude AI Guidance

## Overview

Project Nexus uses custom slash commands to streamline frequent development workflows with Claude. These commands provide structured templates for common tasks, ensuring consistency and reducing repetitive prompting.

## Command Structure

Custom slash commands are Markdown files stored in the `.claude/commands` directory. Each command becomes available through the slash command menu when you type `/`.

## Location and Naming

Commands can be stored in the following locations:

1. **Project-specific commands**: 
   - Location: `/Users/hkr/Documents/GitHub/AgentNexus/.claude/commands/`
   - Format: `<command-name>.md`
   - Access: `/project:<command-name>`
   - Shared with team via source control

2. **Personal commands**:
   - Location: `~/.claude/commands/`
   - Format: `<command-name>.md`
   - Access: `/personal:<command-name>`
   - Available in all Claude Code sessions

## Parameterization

Commands can accept parameters using the special `$ARGUMENTS` placeholder:

```markdown
# Example with parameters
Please analyze this component: $ARGUMENTS.

The analysis should include:
1. Architecture overview
2. Key patterns
3. Potential improvements
```

When you invoke `/project:analyze-component memory-system`, Claude replaces `$ARGUMENTS` with `memory-system`.

## Available Commands

### Project Commands

1. **`/project:fix-issue`**:
   - Purpose: Fix GitHub issues
   - Usage: `/project:fix-issue 123`
   - Description: Analyzes and fixes a GitHub issue by number

2. **`/project:implement-feature`**:
   - Purpose: Implement new features
   - Usage: `/project:implement-feature memory consolidation`
   - Description: Creates a plan and implementation for a new feature

### Creating New Commands

To create a new custom slash command:

1. Create a Markdown file in `.claude/commands/`
2. Name it descriptively, e.g., `refactor-component.md`
3. Write the command template with clear instructions
4. Optionally use `$ARGUMENTS` for parameterization
5. Commit to repository if it should be shared with the team

## Command Examples

### Feature Planning Command

```markdown
# feature-planning.md
Please help me plan the implementation of: $ARGUMENTS.

Create a detailed implementation plan that includes:

1. Component analysis
   - Which components need modification
   - How they interact with the feature

2. Data structure design
   - New interfaces and types
   - Modified existing structures

3. Implementation steps
   - Ordered list of tasks
   - Dependencies between tasks
   - Estimated complexity

4. Testing strategy
   - Unit test approach
   - Integration test needs
   - Edge cases to consider

5. Documentation needs
   - API documentation
   - User documentation
   - Example usage
```

### Code Review Command

```markdown
# code-review.md
Please review the following code changes for: $ARGUMENTS.

Files to review:
$ARGUMENTS

Focus on:
1. Code quality and readability
2. Performance concerns
3. Error handling
4. Type safety
5. Testing coverage
6. Documentation quality

For each issue found, please:
- Describe the issue clearly
- Explain why it's problematic
- Suggest a specific improvement
- Provide code examples where appropriate

End with an overall assessment and summary of recommendations.
```

## Best Practices

1. **Keep Commands Focused**:
   - Design each command for a specific task
   - Avoid overly generic commands
   - Break complex workflows into multiple commands

2. **Include Clear Instructions**:
   - Provide step-by-step guidance
   - Specify expected output format
   - Include examples where helpful

3. **Use Consistent Formatting**:
   - Follow a standard structure across commands
   - Use numbered lists for sequential steps
   - Use bullet points for options or considerations

4. **Update Regularly**:
   - Refine commands based on usage patterns
   - Remove outdated commands
   - Add new commands for emerging workflows

5. **Document Commands**:
   - Maintain a list of available commands
   - Include usage examples
   - Explain when each command is most useful

## Command Categories

Organize your custom slash commands into these categories:

1. **Development Workflows**:
   - Feature implementation
   - Bug fixing
   - Refactoring

2. **Documentation**:
   - API documentation
   - User guides
   - Architecture documentation

3. **Testing**:
   - Test case generation
   - Test review
   - Test coverage analysis

4. **Code Review**:
   - PR creation
   - Code quality review
   - Security review

5. **Project Management**:
   - Task breakdown
   - Estimation
   - Progress reporting

## Integration with Development Workflow

Include slash commands in your standard development workflow:

1. **Planning Phase**:
   - Use planning commands to break down tasks
   - Generate implementation roadmaps

2. **Implementation Phase**:
   - Use component-specific implementation commands
   - Apply testing commands for validation

3. **Review Phase**:
   - Use code review commands
   - Apply documentation verification

4. **Deployment Phase**:
   - Use commit/PR preparation commands
   - Generate release notes

## Creating Your Own Commands

To create effective custom slash commands:

1. **Identify Repetitive Tasks**:
   - Notice patterns in your Claude interactions
   - Look for frequently reused prompts

2. **Standardize Instructions**:
   - Create clear, structured prompts
   - Include all necessary context

3. **Test and Refine**:
   - Try your commands in various scenarios
   - Adjust based on results

4. **Share with Team**:
   - Commit useful commands to the repository
   - Document usage patterns and examples