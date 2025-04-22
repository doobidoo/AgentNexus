# GitHub Integration - Claude AI Guidance

## Overview

This document outlines how to effectively use Claude with GitHub for Project Nexus development. Claude can handle many GitHub operations, from creating issues and PRs to managing code reviews and commit messages.

## Prerequisites

1. **GitHub CLI Installation**:
   - Install the GitHub CLI (`gh`): https://cli.github.com/
   - Authenticate with `gh auth login`

2. **Allowlist Configuration**:
   - Add GitHub-related operations to your Claude allowlist
   - Example: `Bash(git:*, gh:*)`

## Common GitHub Workflows

### 1. Repository Operations

```bash
# Clone a repository
gh repo clone owner/repo-name

# Check repository status
gh repo view owner/repo-name

# Create a new repository
gh repo create repo-name --public --description "Description" --homepage URL
```

### 2. Issue Management

```bash
# Create a new issue
gh issue create --title "Issue title" --body "Issue description"

# List issues
gh issue list --state open

# View issue details
gh issue view issue-number

# Close an issue
gh issue close issue-number
```

### 3. Pull Request Operations

```bash
# Create a pull request
gh pr create --title "PR title" --body "PR description" --base main

# List pull requests
gh pr list --state open

# Check out a PR locally
gh pr checkout pr-number

# View PR details
gh pr view pr-number

# Merge a PR
gh pr merge pr-number --merge
```

### 4. Code Review

```bash
# Add comments to a PR
gh pr comment pr-number --body "Comment text"

# Request changes
gh pr review pr-number --request-changes --body "Changes needed"

# Approve PR
gh pr review pr-number --approve --body "LGTM"
```

## GitHub Integration Patterns

### 1. Automated Issue Triage

Claude can help triage new issues:

```
# Workflow steps
1. Fetch new issues: gh issue list --state open --json number,title,body --limit 10
2. Analyze each issue: "Please analyze these issues and suggest appropriate labels and priority"
3. Apply labels: gh issue edit issue-number --add-label "bug,priority-high"
4. Assign issues: gh issue edit issue-number --assignee username
```

### 2. PR Creation and Management

For feature implementation and bug fixes:

```
# Workflow steps
1. Create branch: git checkout -b feature/new-feature
2. Implement changes (with Claude's help)
3. Review changes: git diff
4. Commit changes: git commit -m "Descriptive message"
5. Push branch: git push -u origin feature/new-feature
6. Create PR: gh pr create --title "Add new feature" --body "Detailed description"
```

### 3. Commit Message Conventions

Project Nexus follows the Conventional Commits standard:

```
<type>(<scope>): <short summary>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons, etc.
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(memory): implement semantic memory consolidation

Add functionality to periodically review and merge similar memories
based on semantic similarity and temporal proximity.

Resolves #123
```

### 4. Code Review Automation

Claude can help with code reviews:

```
# Workflow steps
1. Fetch PR details: gh pr view pr-number --json files
2. Get changed files: gh pr diff pr-number
3. Ask Claude to review: "Please review these changes for bugs, style issues, and performance concerns"
4. Submit comments: gh pr comment pr-number --body "Claude's feedback"
```

### 5. PR Description Templates

When creating PRs, use this template:

```markdown
## Description
[Brief description of the changes]

## Motivation
[Why these changes are needed]

## Implementation Details
[Technical details and approach]

## Testing
[How these changes were tested]

## Screenshots (if applicable)
[Screenshots of UI changes]

## Related Issues
Fixes #[issue-number]
```

## Advanced GitHub Integration

### 1. Branch Management Strategies

Project Nexus follows a trunk-based development model:

- `main`: Primary branch, always deployable
- `feature/*`: Feature development branches
- `fix/*`: Bug fix branches
- `refactor/*`: Code refactoring branches

Branch naming convention:
```
<type>/<descriptive-name>
```

Examples:
- `feature/memory-consolidation`
- `fix/retrieval-duplicates`
- `refactor/action-system`

### 2. CI/CD Integration

When working with CI/CD workflows:

```
# Check workflow status
gh workflow list
gh run list --workflow=workflow-name.yml

# View workflow details
gh run view run-id

# Re-run failed workflow
gh run rerun run-id
```

### 3. Release Management

For managing releases:

```
# Create a release
gh release create v1.0.0 --title "v1.0.0" --notes "Release notes"

# List releases
gh release list

# Download a release
gh release download v1.0.0
```

## Example Claude Prompts for GitHub Tasks

### Creating a Pull Request

```
Please help me create a pull request for the changes I've made to the memory system.

The changes implement memory consolidation as described in issue #42.
Key files changed:
1. src/core/memory/index.ts - Added interfaces
2. src/core/memory/consolidation.ts - New file
3. src/core/memory/long-term.ts - Updated to use consolidation

Please generate a well-structured PR description following our template
and create the PR targeting the main branch.
```

### Reviewing Code Changes

```
I've made the following changes to implement the planning system reflection capability:

[Paste git diff or describe changes]

Please review these changes for:
1. Code quality and style
2. Potential bugs or edge cases
3. Performance issues
4. Adherence to our coding standards

Then help me commit these changes with an appropriate commit message
following our conventional commits format.
```

### Addressing Review Comments

```
I received these review comments on my PR #123:

[Paste review comments]

Please help me address each comment by suggesting the necessary code changes.
After we implement the changes, please help me respond to each comment
explaining how we addressed the feedback.
```

## Best Practices

1. **Use Consistent Naming**:
   - Follow project conventions for branches, commits, and PRs
   - Use descriptive names that clearly indicate purpose

2. **Write Meaningful Messages**:
   - Craft detailed commit messages explaining why changes were made
   - Provide context in PR descriptions for reviewers

3. **Keep PRs Focused**:
   - Limit each PR to a single logical change
   - Break large features into smaller, reviewable chunks

4. **Link Issues and PRs**:
   - Reference issues in commits and PRs
   - Use keywords like "Fixes", "Resolves", or "Closes" to auto-link

5. **Review Before Submission**:
   - Ask Claude to review changes before creating PRs
   - Address obvious issues before requesting team review

## Troubleshooting

If GitHub integration issues occur:

1. **Authentication Problems**:
   - Verify GitHub CLI authentication: `gh auth status`
   - Re-authenticate if needed: `gh auth login`

2. **Permission Errors**:
   - Check repository permissions
   - Verify user has appropriate access roles

3. **API Rate Limiting**:
   - Be aware of GitHub API rate limits
   - Implement backoff strategies for automation

## Additional Resources

- GitHub CLI documentation: https://cli.github.com/manual/
- Conventional Commits specification: https://www.conventionalcommits.org/
- Project Nexus GitHub workflow: see `/docs/standards/github-workflow.md`