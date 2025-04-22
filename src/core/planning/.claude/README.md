# Planning System Development Guide

This directory contains guidance specific to the planning system implementation. For detailed implementation standards, refer to:

- Complete standards: `/docs/standards/planning-system.md`
- Claude guidance: `/docs/claude/planning-system.claude.md`

## Quick Reference

### Key Interfaces

- `IPlanningStrategy`: Interface for planning strategies
- `IPlan`: Interface for structured plans
- `IPlanExecutor`: Interface for plan execution
- `IPlanMonitor`: Interface for monitoring execution
- `IReflectionManager`: Interface for reflection capabilities

### Implementation Files

- `index.ts`: Main exports and types
- `chain-of-thoughts.ts`: Chain of Thoughts implementation
- `subgoal.ts`: Subgoal planning strategy
- `reflection.ts`: Reflection capabilities
- `self-critics.ts`: Self-critique mechanisms

### Common Tasks

1. Implementing a new planning strategy
2. Enhancing reflection capabilities
3. Adding plan monitoring features
4. Implementing strategy selection logic

## Implementation Patterns

Sample implementation patterns can be found in the Claude guidance file. For component-specific questions, include `nexus-standards planning` in your prompt to Claude.
