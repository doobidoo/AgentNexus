Please analyze and fix GitHub issue: $ARGUMENTS.

Follow these steps:

1. Use `gh issue view $ARGUMENTS` to get the issue details
2. Understand the problem described in the issue
3. Search the codebase for relevant files
4. Implement the necessary changes to fix the issue
5. Write and run tests to verify the fix
6. Ensure code passes linting and type checking
7. Create a descriptive commit message following our conventions:
   ```
   fix(<component>): brief description
   
   Detailed explanation of the changes and why they were made.
   
   Fixes #$ARGUMENTS
   ```
8. Suggest a pull request title and description

Remember to follow Project Nexus coding standards and check the component-specific .claude.md files for implementation guidance.