# Agent Nexus

Agent Nexus is an advanced cognitive agent architecture framework that enables AI systems to operate with human-like reasoning abilities. By integrating memory management, specialized tools, strategic planning, and action execution into a cohesive system, Agent Nexus creates agents that can solve complex problems, learn from experience, and provide continuous value.

## Architecture Overview

The Agent Nexus architecture consists of four core components:

1. **Memory**: Divided into short-term (for immediate context) and long-term (for persistent knowledge), allowing the agent to maintain continuity across interactions.

2. **Tools**: A suite of capabilities including:
   - VectorSearch() - Semantic similarity search
   - TextGeneration() - Context-aware content creation
   - CodeExecutor() - Secure code execution
   - WebBrowser() - Web access and information retrieval
   - (Coming soon) ImageAnalysis(), KnowledgeGraph(), DocAnalysis(), RAGRetrieval()

3. **Planning**: The cognitive center featuring:
   - Reflection - Self-assessment of reasoning processes
   - Self-critics - Error identification and correction
   - Chain of thoughts - Transparent reasoning pathways
   - Subgoal decomposition - Breaking complex problems into manageable tasks

4. **Action**: The execution layer that implements plans and processes feedback to improve future performance.

## Key Advantages

1. **Self-Correction**: The architecture enables agents to critique their own work before execution, significantly reducing errors.
2. **Human-Like Reasoning**: By mimicking human cognitive processes, these agents can solve problems with greater nuance.
3. **Continuous Improvement**: The feedback loop between action and planning creates a system that learns from every interaction.
4. **Provider Flexibility**: Support for multiple AI model providers allows choosing the best model for each task.

## Multi-Model Support

Agent Nexus supports multiple AI model providers, allowing you to choose the best fit for your needs:

1. **OpenAI** - GPT-4o, GPT-3.5 Turbo
2. **Anthropic** - Claude 3.7 Sonnet, Claude 3 Opus
3. **Google Gemini** - Gemini 1.5 Pro
4. **Local LLMs via Ollama** - Llama 3, Mistral, and other local models

Benefits of multi-model support:
- **Flexibility**: Choose models based on specific task requirements
- **Resilience**: Fall back to alternative providers if needed
- **Cost Optimization**: Select models based on budget constraints
- **Privacy**: Use local models for sensitive information
- **Experimentation**: Compare outputs across different models

## Technologies Used

- **Agno**: Lightweight framework for building agents with memory, knowledge, tools, and reasoning
- **claude-task-master**: AI-powered task management system
- **Next.js**: React framework for building the web interface
- **TypeScript**: For type-safe code
- **Multiple AI Providers**: OpenAI, Anthropic, Google Gemini, Ollama

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- API keys for the model providers you want to use (OpenAI, Anthropic, Google)
- Ollama (optional, for local models)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/AgentNexus.git
   cd AgentNexus
   ```

2. Run the setup script:
   ```bash
   npm run setup
   # or
   yarn setup
   # or
   pnpm setup
   ```

3. Configure your model providers:
   - Copy `sample.env.local` to `.env.local`
   - Add your API keys for the providers you want to use
   - Set your default provider

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Usage

### Web Interface

The web interface provides a simple way to interact with Agent Nexus. You can:
- Chat directly with the agent
- Submit complex tasks for processing
- View the agent's reasoning process
- Switch between different AI model providers
- Explore the cognitive architecture

### API

You can also interact with Agent Nexus through its API:

```javascript
// Example fetch request
const response = await fetch('/api/agent', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'Analyze the performance implications of using vector search in a production environment',
    type: 'task', // or 'chat' for simpler interactions
    provider: 'anthropic', // optional: specify the provider to use
    model: 'claude-3-7-sonnet-20250219' // optional: specify the model to use
  })
});

const data = await response.json();
console.log(data.response);
```

### Task-Master Integration

Agent Nexus integrates with claude-task-master for task management:

```bash
# View current tasks
npm run task-master list

# Process the next task with Agent Nexus
npm run process-task
```

### Testing Tools and Models

You can test individual tools with the test-tool script:

```bash
# Test vector search
npm run test-tool -- vectorSearch '{"query":"example search"}'

# Test text generation
npm run test-tool -- textGeneration '{"prompt":"Summarize the benefits of AI","temperature":0.7}'

# Test code execution
npm run test-tool -- codeExecutor '{"code":"console.log(\"Hello, world!\");","language":"javascript"}'

# Test web browser
npm run test-tool -- webBrowser '{"url":"https://example.com","operation":"get"}'
```

Test different model providers:

```bash
# Test all configured providers
npm run test-models

# Test a specific provider
npm run test-models -- openai
npm run test-models -- anthropic
npm run test-models -- ollama
```

## Project Structure

```
/AgentNexus
│
├── src/
│   ├── app/                    # Next.js app
│   │   ├── api/                # API routes
│   │   │   ├── agent/          # Agent API endpoints
│   │   │   └── models/         # Model provider endpoints
│   │   ├── page.tsx            # Main page
│   │   └── layout.tsx          # App layout
│   │
│   ├── components/             # UI components
│   │   ├── AgentInterface.tsx  # Agent chat interface
│   │   ├── ModelSelector.tsx   # Model provider selector
│   │   └── ArchitectureVisualizer.tsx # Architecture diagram
│   │
│   ├── core/                   # Core Agent Nexus components
│   │   ├── agent.ts            # Main Agent class
│   │   ├── memory/             # Memory system components
│   │   ├── models/             # Model provider implementations
│   │   ├── tools/              # Tools integration
│   │   ├── planning/           # Planning system
│   │   └── action/             # Action system
│   │
│
├── scripts/                    # Utility scripts
│   ├── setup.sh                # Setup script
│   ├── test-tool.ts            # Tool testing script
│   ├── test-models.ts          # Model provider testing script
│   ├── run-first-task.ts       # First task test script
│   └── task-nexus-bridge.ts    # Integration with task-master
│
├── tests/                      # Test utilities and tests
└── tasks/                      # Task definitions for task-master
```

## Adding a New Model Provider

To add a new model provider:

1. Create a new provider class in `src/core/models/` that implements the `ModelProvider` interface
2. Update the `ModelProviderType` and factory in `src/core/models/index.ts`
3. Add the provider to the initialization in `src/core/models/factory.ts`
4. Add the provider's configuration to `sample.env.local`

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development guidelines.

### Running Tests

```bash
# Run all tests
npm test

# Run specific tests
npm run test-memory
npm run test-models
```

## Roadmap

1. **Additional Tools**: Complete implementation of remaining tools (ImageAnalysis, KnowledgeGraph, DocAnalysis, RAGRetrieval)

2. **Advanced Memory System**: Connect to vector databases and implement memory consolidation

3. **Enhanced Planning**: Improve reasoning with more sophisticated models and strategies

4. **Provider Integrations**: Add support for more AI model providers and improve existing ones

5. **User Interface Improvements**: Add visualization for agent's thought processes

6. **Multi-Agent Orchestration**: Enable multiple agents to work together

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Agno](https://github.com/agno-agi/agno) - For the agent framework
- [claude-task-master](https://github.com/eyaltoledano/claude-task-master) - For the task management system
- [OpenAI](https://openai.com), [Anthropic](https://anthropic.com), [Google](https://ai.google.dev/), and [Ollama](https://ollama.ai/) - For model provider APIs
- [Manthan Patel](https://www.udemy.com/user/manthan-patel-4/) - For the ignition with this [LinkedIn Post](https://www.linkedin.com/posts/leadgenmanthan_the-future-of-ai-is-agent-architecture-activity-7317020448800620544-n1DM?utm_source=social_share_send&utm_medium=member_desktop_web&rcm=ACoAAAEKcBABpX_w4skUzI2RjUnug_hH9TDdIJc)
