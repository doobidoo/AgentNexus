# Project Nexus Completion Prompt (V2)

## 1. Project Overview

Project Nexus is a cognitive agent architecture framework. This prompt serves as a comprehensive structure for continuing development across multiple sessions, enhanced with integrated MCP (Most Capable Procedure) tools for efficient development workflows.

**Repository Location:** /YourDirectoryPathTo/AgentNexus/

**Vision Statement:** To create a modular, extensible cognitive agent architecture that integrates memory, planning, action, and tool systems into a cohesive framework.

**Project Lifecycle:**
- Analysis → Planning → Implementation → Testing → Documentation → Integration

## 2. Command System

### Core Commands

When I use any of these keywords, retrieve and analyze the corresponding project information:

- `nexus-status`: Review overall project status, current priorities, and next steps
- `nexus-memory`: Access memory system for previous work and project context
- `nexus-tasks`: Manage tasks and priorities
- `nexus-continue`: Continue highest priority task from previous session
- `nexus-help`: Show all available commands and usage examples

### System-Specific Commands

- `nexus-tools`: Focus on tool management system development
- `nexus-memory-system`: Focus on memory system implementation
- `nexus-planning`: Work on planning system components
- `nexus-action`: Develop action system execution engine
- `nexus-integration`: Implement API and integration interfaces

### Tool-Specific Commands

- `nexus-file [operation]`: Perform file operations (read, write, edit, search)
- `nexus-git [operation]`: Execute GitHub operations (commit, push, branch)
- `nexus-browser [operation]`: Run browser automation tasks
- `nexus-analyze [code]`: Analyze code using JavaScript REPL
- `nexus-think [problem]`: Apply sequential thinking to complex problems

### Command Syntax Examples

```
nexus-file read src/core/memory/MemoryManager.ts
nexus-git commit "Implement memory indexing function"
nexus-browser automate login-sequence
nexus-analyze "function testMemoryRetrieval() { ... }"
nexus-think "How should we structure the planning system hierarchy?"
```

## 3. Development Workflows

### Task Management Workflow

Use the MCP todo functions for structured task management:

1. **Task Creation:** 
   ```
   add_todo "Implement memory indexing function" "today"
   add_todo "Design planning system hierarchy" "later"
   ```

2. **Task Visualization:**
   ```
   show_all_todos
   show_today_todos
   ```

3. **Task Completion:**
   ```
   complete_todo "task_id"
   ```

4. **Task Prioritization:**
   - Critical: Security and core functionality
   - High: User-facing features
   - Medium: Performance improvements
   - Low: Documentation and refactoring

5. **Task Dependencies:**
   - Document dependencies in task descriptions
   - Complete prerequisite tasks first
   - Track dependency chains

### Code Development Workflow

1. **Code Analysis:**
   - Use `read_file` to examine existing code:
     ```
     read_file "/Users/hkr/Documents/GitHub/AgentNexus/src/core/memory/MemoryManager.ts"
     ```
   - Use `read_multiple_files` for component analysis:
     ```
     read_multiple_files ["/path/file1.ts", "/path/file2.ts"]
     ```
   - Use `directory_tree` for project structure understanding:
     ```
     directory_tree "/Users/hkr/Documents/GitHub/AgentNexus/src/core"
     ```

2. **Code Implementation:**
   - Use `write_file` for new files:
     ```
     write_file "/path/to/new/file.ts" "content"
     ```
   - Use `edit_file` for existing files:
     ```
     edit_file "/path/to/file.ts" [edits]
     ```
   - Use `create_directory` for new modules:
     ```
     create_directory "/path/to/new/module"
     ```

3. **Code Organization:**
   - Core components in /src/core/
   - Tool implementations in /src/core/tools/
   - Memory systems in /src/core/memory/
   - Planning components in /src/core/planning/
   - Action components in /src/core/action/

4. **Code Testing:**
   - Write tests concurrently with implementation
   - Use test-driven development where appropriate
   - Ensure all code paths are tested

### Repository Management Workflow

Utilize GitHub MCP functions for efficient repository management:

1. **File Updates:**
   ```
   create_or_update_file {
     owner: "username",
     repo: "AgentNexus",
     path: "src/core/memory/MemoryIndex.ts",
     content: "file content",
     message: "Add memory indexing implementation",
     branch: "main"
   }
   ```

2. **Multiple File Commits:**
   ```
   push_files {
     owner: "username",
     repo: "AgentNexus",
     branch: "main",
     files: [
       { path: "file1.ts", content: "content1" },
       { path: "file2.ts", content: "content2" }
     ],
     message: "Implement memory indexing system"
   }
   ```

3. **Feature Development:**
   ```
   create_branch {
     owner: "username",
     repo: "AgentNexus",
     branch: "feature/memory-indexing"
   }
   ```

4. **Pull Request Creation:**
   ```
   create_pull_request {
     owner: "username",
     repo: "AgentNexus",
     title: "Implement Memory Indexing",
     head: "feature/memory-indexing",
     base: "main",
     body: "This PR implements memory indexing functionality."
   }
   ```

5. **Commit Message Standards:**
   - Start with verb (Add, Fix, Update, Refactor)
   - Keep under 72 characters
   - Describe what and why, not how
   - Reference tasks or issues when relevant

6. **Session Completion Repository Handling:**
   - After completing tasks, always provide a formatted commit message in a code block
   - Store a memory entry summarizing the changes made
   - The commit message should follow the format:
   ```
   git commit -m "[Action] [Component]: [Brief description]
   
   - [Detail point 1]
   - [Detail point 2]
   - [Detail point 3]
   
   [References/Issue numbers]"
   ```
   - This commit message should be easily copyable for direct use in the terminal

### Memory System Workflow

Use memory MCP functions to maintain project context across sessions:

1. **Storing Session Memory:**
   ```
   store_memory {
     content: "Implemented memory indexing function with O(log n) retrieval time",
     metadata: {
       tags: "memory-system,indexing,performance",
       type: "implementation"
     }
   }
   ```

2. **Retrieving Context:**
   ```
   retrieve_memory {
     query: "memory indexing implementation",
     n_results: 5
   }
   ```

3. **Time-Based Recall:**
   ```
   recall_memory {
     query: "work done last session on memory system",
     n_results: 5
   }
   ```

4. **Tag-Based Search:**
   ```
   search_by_tag {
     tags: ["memory-system", "indexing"]
   }
   ```

5. **Memory Structure:**
   - Capture tasks completed
   - Document implementation details
   - Note challenges encountered
   - Record next steps
   - Reference key code locations

### Web Automation Workflow

Maintain the use of Playwright as the primary tool for web automation:

1. **Browser Automation Principles:**
   - Use Playwright exclusively for all web automation and testing
   - Isolate browser automation code into dedicated service modules with clear responsibilities
   - Use TypeScript types from @playwright/test for all browser interactions
   - Implement proper error handling with exponential backoff retry mechanisms for network operations
   - Cache browser contexts when possible for improved performance (10-30% speed improvement)
   - Configure automation for both headless and headed operation via environment variables

2. **Implementation Standards:**
   - Structure Playwright code using page object model pattern
   - Implement component-based selectors for maximum reusability
   - Use data-testid attributes for primary element selection
   - Implement robust waiting strategies using waitForSelector and waitForLoadState
   - Document all page objects and automation workflows
   - Maintain separation between test logic and page interaction code
   - Implement screenshot capture on failure for all automated tests

3. **Migration Strategy:**
   - Audit existing Puppeteer implementations and prioritize migration by usage frequency
   - Create 1:1 mapping documentation between Puppeteer and Playwright APIs
   - Migrate test fixtures first, followed by utility functions and page objects
   - Validate each migration with comprehensive test coverage
   - Document any compatibility challenges during migration
   - Maintain a migration progress tracker in /docs/migrations/playwright.md

4. **Testing Integration:**
   - Implement UI testing with Playwright Test runner
   - Use Playwright's API for data-driven testing scenarios
   - Implement visual regression testing with Playwright's screenshot comparison
   - Utilize Playwright's network interception for API mocking and testing
   - Set up parallel test execution for optimal CI/CD performance
   - Configure trace viewers for debugging test failures
   - Implement accessibility testing using Playwright's accessibility API

5. **Performance Optimization:**
   - Use browser context sharing to minimize browser startup overhead
   - Implement request interception to block unnecessary resources during testing
   - Configure viewport and device emulation appropriately for tests
   - Use isolated storage states for authentication to avoid repeated logins
   - Implement custom fixtures for common testing scenarios
   - Optimize screenshot and video capture settings based on testing needs

6. **Security Considerations:**
   - Never store credentials in test code; use environment variables
   - Implement secure handling of authentication tokens
   - Sanitize any sensitive data in logs and screenshots
   - Use dedicated test accounts with limited permissions
   - Implement timeout limits for all network operations
   - Validate CSP compliance in automation scripts

**Legacy Tool Handling:** Only use Puppeteer temporarily if a specific feature is absolutely unavailable in Playwright. Document any such exceptions with clear justification and create a ticket for migration as soon as possible.

### Analysis and Problem-Solving Workflow

1. **Code Analysis with REPL:**
   ```
   repl {
     code: `
       // Analyze memory retrieval performance
       const testData = [...Array(1000)].map((_, i) => ({ id: i, content: `Memory ${i}` }));
       console.log(testData.length);
       // Test indexing function
       function createIndex(memories) {
         // Implementation
       }
       console.log(createIndex(testData));
     `
   }
   ```

2. **Complex Problem Solving:**
   ```
   sequentialthinking {
     thought: "First, I need to understand the current memory indexing approach...",
     thoughtNumber: 1,
     totalThoughts: 5,
     nextThoughtNeeded: true
   }
   ```

3. **Analysis Documentation:**
   - Document insights from analysis
   - Capture performance metrics
   - Record decision rationales
   - Link to specific code implementations

## 4. Technical Standards

### Coding Standards

- TypeScript with strict typing
- Follow OOP principles with interfaces and abstract classes
- Event-driven architecture for component communication
- Comprehensive error handling and logging
- Modular components with clear responsibilities
- Pure functions where possible
- Dependency injection for testability
- Async/await for asynchronous operations

### Documentation Standards

- JSDoc for all public methods and classes
- README.md for each module
- Architecture diagrams for complex systems
- Usage examples for public APIs
- Clear comments explaining "why" not "what"
- Update documentation concurrently with code

### Testing Standards

- Unit tests for all functions and methods
- Integration tests for component interactions
- End-to-end tests for critical workflows
- Mocking for external dependencies
- Test coverage target of 80%+
- Performance benchmarks for critical paths

### Integration Standards

- RESTful API design principles
- Consistent error response format
- Versioned endpoints
- Authentication and authorization
- Rate limiting and security headers
- Comprehensive API documentation

### Security Standards

- Input validation on all external inputs
- Output encoding to prevent injection
- Authentication for all sensitive operations
- Authorization for all protected resources
- Secrets management (no hardcoded credentials)
- Regular dependency updates

### Error Handling Framework

- **Error Hierarchy:**
  - Base error classes for each major subsystem
  - Specialized error types for specific failure modes
  - Contextual information attached to all errors
  - Severity levels (Critical, Error, Warning, Info)

- **Recovery Strategies:**
  - Retry mechanisms with exponential backoff
  - Circuit breaker patterns for external services
  - Fallback mechanisms for critical operations
  - Self-healing capabilities for common errors

- **User-Facing Errors:**
  - Clear, actionable error messages
  - Appropriate technical details based on context
  - Localization support for error messages
  - Links to relevant documentation when applicable

- **Monitoring and Reporting:**
  - Centralized error logging system
  - Error aggregation and pattern detection
  - Alert mechanisms for critical errors
  - Periodic error analysis reports

- **Graceful Degradation:**
  - Non-critical feature disablement
  - Reduced functionality modes
  - Clear communication of degraded state
  - Recovery path documentation

### CI/CD Framework

- **Build Pipeline:**
  - Automated builds on commit
  - Static code analysis integration
  - Dependency vulnerability scanning
  - Build artifact versioning
  - Reproducible build environment

- **Testing Pipeline:**
  - Tiered testing approach (Unit → Integration → E2E)
  - Parallelized test execution
  - Test environment provisioning
  - Snapshot testing for UI components
  - Performance regression testing

- **Deployment Strategy:**
  - Environment promotion flow (Dev → Staging → Production)
  - Canary deployments for risk mitigation
  - Automated rollback capabilities
  - Feature flag integration
  - Zero-downtime deployment patterns

- **Monitoring and Alerting:**
  - Performance metrics collection
  - User experience monitoring
  - Service health dashboards
  - Proactive alerting thresholds
  - Post-deployment validation

- **Documentation Integration:**
  - Automated changelog generation
  - API documentation versioning
  - Deployment history tracking
  - Environment configuration documentation
  - Release notes generation

## 5. AI and Cognitive Systems

### AI/LLM Integration

- **Prompt Engineering Standards:**
  - Templated prompts with clear parameter injection
  - Version control for prompt templates
  - A/B testing framework for prompt optimization
  - Prompt evaluation metrics and benchmarks
  - Context window management guidelines

- **LLM Connection Patterns:**
  - Standardized client interfaces for multiple providers
  - Transparent fallback mechanisms between models
  - Caching strategies for common queries
  - Cost optimization guidelines
  - Response validation and sanitization

- **Context Management:**
  - Efficient context compression techniques
  - Relevant information retrieval and filtering
  - Context prioritization algorithms
  - Sliding window approaches for long conversations
  - Context refresh strategies

- **Evaluation Framework:**
  - Response quality metrics
  - Factual accuracy verification
  - Consistency checking
  - Bias detection and mitigation
  - Performance monitoring dashboard

### Knowledge Graph Integration

- **Graph Structure:**
  - Entity definition standards
  - Relationship type taxonomy
  - Attribute schema guidelines
  - Metadata requirements
  - Versioning approach

- **Knowledge Acquisition:**
  - Entity extraction patterns
  - Relationship inference methods
  - Confidence scoring
  - Source attribution
  - Conflict resolution

- **Query Patterns:**
  - Path-based queries
  - Pattern matching
  - Semantic similarity search
  - Temporal reasoning
  - Probabilistic inference

- **Maintenance:**
  - Validation and verification procedures
  - Obsolescence detection
  - Knowledge refresh cycles
  - Consistency checking
  - Performance optimization

### Enhanced Memory System

- **Memory Types:**
  - Episodic (experience-based)
  - Semantic (factual knowledge)
  - Procedural (how-to knowledge)
  - Working (current context)
  - Associative (relationship-based)

- **Vector Database Integration:**
  - Embedding generation standards
  - Dimensional reduction strategies
  - Clustering approaches
  - Index optimization
  - Multi-modal embedding handling

- **Memory Operations:**
  - Encoding (acquisition and formatting)
  - Storage (organization and persistence)
  - Retrieval (access and ranking)
  - Consolidation (refinement and summarization)
  - Forgetting (pruning and archiving)

- **Memory Usage Patterns:**
  - Relevance-based retrieval
  - Temporal sequence reconstruction
  - Counterfactual reasoning support
  - Analogical mapping
  - Causal reasoning

### Multi-Agent Coordination

- **Agent Roles and Responsibilities:**
  - Role definition framework
  - Capability advertisement
  - Skill registry
  - Specialization guidelines
  - Dynamic role assignment

- **Communication Protocol:**
  - Message format standards
  - Conversation flow patterns
  - Negotiation frameworks
  - Information sharing policies
  - Error handling conventions

- **Task Distribution:**
  - Task decomposition strategies
  - Workload balancing algorithms
  - Priority-based assignment
  - Deadline management
  - Progress reporting standards

- **Conflict Resolution:**
  - Resource contention handling
  - Goal alignment verification
  - Consensus building protocols
  - Arbitration mechanisms
  - Rollback procedures

### Ethics and Safety

- **Ethical Guidelines:**
  - User privacy protection
  - Informed consent practices
  - Fairness and bias mitigation
  - Transparency requirements
  - Accountability framework

- **Safety Mechanisms:**
  - Content filtering standards
  - Harmful instruction detection
  - Output validation procedures
  - User feedback integration
  - Override protocols

- **Explainability:**
  - Decision trace documentation
  - Confidence level reporting
  - Alternative consideration exposure
  - Limitation disclosure
  - Source attribution

- **User Control:**
  - Preference management
  - Correction mechanisms
  - System behavior customization
  - Data retention controls
  - Usage boundaries definition

## 6. Project Structure

### Directory Organization

- /src/core/ - Core framework components
  - /memory/ - Memory system implementation
  - /planning/ - Planning system components
  - /action/ - Action execution engine
  - /tools/ - Tool management system
  - /integration/ - API and external integrations
- /tests/ - Test suites
  - /unit/ - Unit tests
  - /integration/ - Integration tests
  - /e2e/ - End-to-end tests
- /docs/ - Documentation
- /examples/ - Example implementations
- /scripts/ - Build and utility scripts

### Component Architecture

- **Memory System:**
  - MemoryManager (orchestration)
  - MemoryStore (storage)
  - MemoryRetrieval (retrieval)
  - MemoryIndex (indexing)

- **Planning System:**
  - PlanningManager (orchestration)
  - GoalManager (goal tracking)
  - PlanGenerator (plan creation)
  - PlanExecutor (plan execution)

- **Action System:**
  - ActionManager (orchestration)
  - ActionRegistry (registration)
  - ActionExecutor (execution)
  - ActionResult (result handling)

- **Tool System:**
  - ToolManager (orchestration)
  - ToolRegistry (registration)
  - ToolExecutor (execution)
  - ToolResult (result handling)

### Interface Standards

- Use interfaces for all public APIs
- Define contracts before implementation
- Version interfaces explicitly
- Document breaking changes
- Provide migration guides

### Dependency Management

- Prefer latest stable SDK versions
- Document version decisions
- Audit dependencies regularly
- Schedule replacements for deprecated packages
- Set up alerts for major version changes

## 7. Session Management

### Session Initialization

1. Review previous session memory:
   ```
   recall_memory {
     query: "last session on Project Nexus",
     n_results: 3
   }
   ```

2. Check current task status:
   ```
   show_all_todos
   ```

3. Review project structure if needed:
   ```
   directory_tree "/Users/hkr/Documents/GitHub/AgentNexus/src"
   ```

4. Determine session focus:
   - Use system-specific command
   - Continue highest priority task
   - Address specific issue or feature

### Session Execution

1. Break task into manageable steps
2. Implement code using file operations
3. Test implementation
4. Document changes
5. Update task status

### Session Completion

1. Summarize accomplishments:
   ```
   store_memory {
     content: "Session summary: Implemented memory indexing with B-tree structure...",
     metadata: {
       tags: "session-summary,memory-system,indexing",
       type: "summary"
     }
   }
   ```

2. Update task status:
   ```
   complete_todo "task_id"
   ```

3. Prepare commit message (always provide this in a code block for easy copying):
   ```
   git commit -m "feat(memory): Implement memory indexing with B-tree structure

   - Add B-tree implementation for memory indexing
   - Optimize retrieval performance to O(log n)
   - Add unit tests for indexing operations
   - Update documentation with usage examples

   Resolves #42"
   ```

4. Identify next steps:
   ```
   add_todo "Optimize memory retrieval for large datasets" "later"
   ```

**Important**: After every development session, ALWAYS provide:
1. A memory entry storing the session's accomplishments and decisions
2. A properly formatted commit message in a code block
3. This is mandatory even for small changes or partial task completion

### Cross-Session Continuity

1. Store detailed context in memory:
   ```
   store_memory {
     content: "Implementation details: The memory indexing system uses a B-tree structure with order 5...",
     metadata: {
       tags: "implementation-details,memory-system,indexing,b-tree",
       type: "technical"
     }
   }
   ```

2. Document decision rationales:
   ```
   store_memory {
     content: "Decision rationale: Chose B-tree over hash-based indexing because...",
     metadata: {
       tags: "decision-rationale,memory-system,indexing",
       type: "decision"
     }
   }
   ```

3. Maintain progress tracking:
   ```
   edit_file "/Users/hkr/Documents/GitHub/AgentNexus/progress.md" [edits]
   ```

4. Update project roadmap:
   ```
   edit_file "/Users/hkr/Documents/GitHub/AgentNexus/ROADMAP.md" [edits]
   ```

---

## 8. Conclusion and Integration Guidelines

### Prompt Usage Guidelines

- Use this prompt at the beginning of each development session
- Reference specific sections as needed during development
- Update this prompt as the project evolves
- Share this prompt with all team members for consistency

### Version Control

- This prompt should be version-controlled alongside the codebase
- Document major changes to the prompt in the project changelog
- Tag prompt versions to align with major project milestones
- Review and update the prompt quarterly

### Integration with Development Tools

- IDE extensions should incorporate these standards
- CI/CD pipelines should validate compliance with these guidelines
- Code review processes should reference relevant sections
- Documentation should follow the patterns established here

### Continuous Improvement

- Collect feedback on the effectiveness of this framework
- Identify areas where additional guidance is needed
- Measure adherence to standards over time
- Adapt guidelines based on project evolution and team feedback

---

This enhanced prompt provides a comprehensive framework for continuing development of Project Nexus across multiple sessions. It integrates available MCP tools with cognitive agent architecture best practices while maintaining consistent standards for code, documentation, and process. Use this living document as your guide to efficient, structured, and high-quality development.