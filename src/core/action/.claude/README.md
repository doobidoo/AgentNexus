# Action System Development Guide

This directory contains guidance specific to the action system implementation. For detailed implementation standards, refer to:

- Complete standards: `/docs/standards/action-system.md`
- Claude guidance: `/docs/claude/action-system.claude.md`

## Quick Reference

### Key Interfaces

- `IAction`: Interface for all action types
- `IActionExecutor`: Interface for action execution
- `IToolInvoker`: Interface for tool invocation
- `IFeedbackCollector`: Interface for feedback collection

### Implementation Files

- `index.ts`: Main exports and types
- `execution.ts`: Action execution engine
- `feedback.ts`: Feedback collection mechanisms

### Action Types

- `ToolAction`: Actions that invoke tools
- `CommunicationAction`: Actions that communicate with users
- `InternalAction`: Actions that modify internal state
- `CompositeAction`: Actions composed of other actions

### Common Tasks

1. Adding a new action type
2. Enhancing execution monitoring
3. Implementing action composition
4. Adding validation capabilities

## Implementation Patterns

Sample implementation patterns can be found in the Claude guidance file. For component-specific questions, include `nexus-standards action` in your prompt to Claude.