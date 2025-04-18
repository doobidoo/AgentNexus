# Contributing to Agent Nexus

Thank you for your interest in contributing to Agent Nexus! This document provides guidelines and instructions for contributing to this project.

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/AgentNexus.git
   cd AgentNexus
   ```

2. **Run the setup script**:
   ```bash
   npm run setup
   # or
   yarn setup
   # or
   pnpm setup
   ```

3. **Set your OpenAI API key** in `.env.local`:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

## Project Architecture

Agent Nexus follows a modular architecture with these key components:

- **Memory System**: Short-term and long-term memory components
- **Tools**: Specialized capabilities like VectorSearch and TextGeneration
- **Planning**: Cognitive components for reasoning and planning
- **Action**: Execution and feedback mechanisms

When contributing, please maintain this architectural separation.

## Development Workflow

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement your changes** following the coding standards

3. **Write or update tests** for your changes

4. **Run tests** to ensure everything works:
   ```bash
   npm run test
   ```

5. **Submit a pull request** to the `main` branch

## Coding Standards

- Follow TypeScript best practices
- Use meaningful variable and function names
- Include comprehensive comments for complex logic
- Follow the existing code style and formatting
- Keep components modular and focused on single responsibilities

## Adding New Tools

When implementing a new tool:

1. Create a new file in `src/core/tools/` using the existing tool structure
2. Implement the tool class extending `AbstractTool`
3. Define clear input/output interfaces
4. Add proper validation and error handling
5. Register the tool in the `ToolsManager`

## Documentation

- Document all public methods and classes
- Update the README.md with any new features or changes
- Include examples of usage where appropriate

## Testing

- Write tests for all new functionality
- Ensure existing tests pass with your changes
- Test edge cases and error conditions

## Pull Request Process

1. Update the README.md and documentation with details of changes
2. Increase version numbers in package.json and any other files if appropriate
3. The PR will be merged once it receives approval from a maintainer

## Task Management

This project uses claude-task-master for task management:

- View current tasks with `npm run task-master list`
- Process tasks with `npm run process-task`
- Add new tasks following the task-master format

## Code of Conduct

- Be respectful and inclusive in all communications
- Focus on the technical merits rather than the person
- Provide constructive feedback
- Help create a positive and collaborative environment

## Questions?

If you have any questions about contributing, please open an issue or reach out to the maintainers.

Thank you for contributing to Agent Nexus!
