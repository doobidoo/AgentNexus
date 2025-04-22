# Headless Mode - Claude AI Guidance

## Overview

Claude Code's headless mode enables non-interactive automation for CI/CD pipelines, scheduled tasks, and bulk operations. This document explains how to use headless mode with Project Nexus to automate development workflows.

## Basic Usage

Headless mode is activated using the `-p` flag followed by your prompt:

```bash
claude -p "Analyze memory-system.ts and suggest optimizations" > analysis.md
```

For structured output, use the `--output-format` flag:

```bash
claude -p "List all TODO comments in the codebase" --output-format stream-json > todos.json
```

## Configuration

### Output Formats

| Format | Description | Use Case |
|--------|-------------|----------|
| `text` | Plain text (default) | General purpose output |
| `stream-json` | Streaming JSON | Automated parsing |
| `json` | Single JSON response | Integration with other tools |

### Security Options

| Option | Description |
|--------|-------------|
| `--dangerously-skip-permissions` | Skip all permission checks (use with caution) |
| `--allowedTools` | Specify allowed tools for the session |

Example with allowed tools:
```bash
claude -p "Fix lint errors" --allowedTools Edit,Bash(git:*)
```

## Common Automation Patterns

### 1. Issue Triage Automation

```bash
#!/bin/bash
# Get new issues
NEW_ISSUES=$(gh issue list --state open --json number,title,body --limit 10)

# Triage with Claude
TRIAGE_RESULT=$(claude -p "Analyze these GitHub issues and suggest labels, priority, and assignees: $NEW_ISSUES" --output-format json)

# Apply triage suggestions
# (Parse JSON and apply labels/assignments)
```

### 2. Code Quality Checks

```bash
#!/bin/bash
# Get changed files
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD)

# Analyze with Claude
ANALYSIS=$(claude -p "Review these files for code quality issues: $CHANGED_FILES" --output-format json)

# Post results as PR comment if issues found
if [[ $(echo $ANALYSIS | jq '.issues | length') -gt 0 ]]; then
  gh pr comment $PR_NUMBER --body "$(echo $ANALYSIS | jq -r '.summary')"
fi
```

### 3. Documentation Generation

```bash
#!/bin/bash
# Get component files
COMPONENT_FILES=$(find ./src/core/memory -name "*.ts")

# Generate documentation with Claude
claude -p "Generate API documentation for these files in Markdown format: $COMPONENT_FILES" > docs/api/memory-system.md
```

### 4. Batch Processing

```bash
#!/bin/bash
# Find all TODOs
TODO_FILES=$(grep -r "TODO" --include="*.ts" ./src)

# Process each TODO item
echo "$TODO_FILES" | while read -r line; do
  FILE=$(echo "$line" | awk -F: '{print $1}')
  TODO=$(echo "$line" | awk -F: '{$1=""; print $0}')
  
  # Process with Claude
  claude -p "Implement this TODO item: $TODO in file $FILE" --allowedTools Edit
done
```

## Integration with CI/CD

### GitHub Actions Integration

```yaml
# .github/workflows/code-review.yml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  code-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Get changed files
        id: changed-files
        run: |
          echo "files=$(git diff --name-only ${{ github.event.pull_request.base.sha }} ${{ github.event.pull_request.head.sha }} | tr '\n' ',')" >> $GITHUB_OUTPUT
      
      - name: Claude Code Review
        run: |
          curl -X POST "https://your-claude-service.example.com/review" \
            -H "Content-Type: application/json" \
            -d "{\"files\": \"${{ steps.changed-files.outputs.files }}\", \"pr\": \"${{ github.event.pull_request.number }}\"}"
```

### Jenkins Pipeline Integration

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    stages {
        stage('Code Analysis') {
            steps {
                script {
                    def changedFiles = sh(script: 'git diff --name-only HEAD~1 HEAD', returnStdout: true).trim()
                    
                    sh """
                        claude -p "Analyze these files for potential issues: ${changedFiles}" \
                            --output-format json > analysis.json
                        
                        if [ \$(jq '.issues | length' analysis.json) -gt 0 ]; then
                            echo "Issues found in code analysis"
                            jq -r '.summary' analysis.json
                            exit 1
                        fi
                    """
                }
            }
        }
    }
}
```

## Security Considerations

When using headless mode, especially with `--dangerously-skip-permissions`:

1. **Isolation**: Run in a restricted environment (container, VM)
2. **Limited Access**: Provide only necessary file access
3. **No Secrets**: Don't expose API keys or credentials
4. **Network Restrictions**: Limit network access
5. **Auditing**: Log all operations for review

## Example Headless Mode Patterns

### 1. Fan-out Processing

Process multiple files in parallel:

```bash
#!/bin/bash
# Find TypeScript files needing migration
find ./src -name "*.ts" | grep -v ".d.ts" > files_to_process.txt

# Process in parallel
cat files_to_process.txt | parallel -j 4 \
  "claude -p 'Update this file to use the new memory API: {}' \
  --allowedTools Edit > logs/{/.}.log 2>&1"
```

### 2. Pipeline Processing

Create processing chains with different Claude invocations:

```bash
#!/bin/bash
# First stage: Code analysis
claude -p "Analyze this code for refactoring opportunities: $FILE" \
  --output-format json > analysis.json

# Second stage: Implementation
cat analysis.json | jq -r '.recommendations' | \
  claude -p "Implement these refactoring recommendations: $(cat)" \
  --allowedTools Edit

# Third stage: Test verification
claude -p "Verify that the refactored code passes all tests" \
  --allowedTools Bash(npm:test)
```

### 3. Event-Driven Processing

Respond to repository events:

```bash
#!/bin/bash
# Webhook handler for new issues
issue_number=$1
issue_title=$2
issue_body=$3

# Generate response with Claude
response=$(claude -p "Analyze this issue and suggest a solution:
Issue #$issue_number: $issue_title
$issue_body" --output-format json)

# Post response as comment
solution=$(echo $response | jq -r '.solution')
gh issue comment $issue_number --body "$solution"
```

## Debugging Headless Mode

When troubleshooting headless mode:

1. **Enable Verbose Mode**:
   ```bash
   claude -p "Your prompt" --verbose > output.txt 2> debug.log
   ```

2. **Test Interactively First**:
   Run commands interactively before automating

3. **Add Debug Output**:
   Include debug flags in your script

4. **Check Exit Codes**:
   ```bash
   claude -p "Your prompt"
   echo "Exit code: $?"
   ```

5. **Timeout Handling**:
   ```bash
   timeout 5m claude -p "Long-running task"
   ```

## Best Practices

1. **Prompt Engineering**:
   - Be explicit and detailed in headless prompts
   - Include all necessary context
   - Specify exactly what output format you need

2. **Error Handling**:
   - Check exit codes and handle failures
   - Implement retry logic for transient issues
   - Log both output and errors

3. **Resource Management**:
   - Limit concurrent Claude processes
   - Implement rate limiting
   - Monitor resource usage

4. **Output Processing**:
   - Use JSON output for structured data
   - Implement proper parsing
   - Validate output before using it

5. **Idempotence**:
   - Design scripts to be safely re-runnable
   - Handle partial completion scenarios
   - Implement appropriate checkpointing