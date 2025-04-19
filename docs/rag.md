# Retrieval Augmented Generation (RAG) Tool

The RAG tool combines VectorSearch and TextGeneration capabilities to create a powerful retrieval-augmented generation system. This tool enhances text generation by incorporating relevant information from a knowledge base.

## How RAG Works

1. **Retrieval**: Takes a user query and searches a vector database for relevant documents
2. **Augmentation**: Formats the retrieved documents into context
3. **Generation**: Uses the context and query to generate a more informed response

## Setup Prerequisites

- Working VectorSearch tool with Weaviate configured
- TextGeneration tool with a language model configured
- Document collection in Weaviate with relevant knowledge

## Usage Examples

### Basic Usage

```javascript
const ragTool = new RAG(vectorSearch, textGeneration);

const result = await ragTool.execute({
  tool: 'rag',
  params: {
    query: "How does the memory system work in Agent Nexus?",
    collection: "Documents",
    topK: 3
  }
});

console.log(result.data.answer); // The generated response
```

### Advanced Configuration

```javascript
const result = await ragTool.execute({
  tool: 'rag',
  params: {
    query: "What tools are available in Agent Nexus?",
    collection: "Documentation",
    topK: 5,
    similarityThreshold: 0.75,
    temperature: 0.3,
    maxTokens: 800,
    includeMetadata: true,
    filters: {
      category: "tools"
    },
    promptTemplate: `
      You are an expert on Agent Nexus.
      
      Based on the following sources:
      {{context}}
      
      Please answer this question in detail:
      {{query}}
    `
  }
});
```

## Key Features

- **Fallback generation**: Gracefully handles cases when no relevant documents are found
- **Customizable prompt templates**: Use your own prompt structure for generation
- **Context window management**: Automatically handles context that exceeds token limits
- **Metadata inclusion**: Optionally includes document metadata in the generation context
- **Result filtering**: Filter retrieval results by metadata properties

## Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| query | string | (required) | The user's query or question |
| collection | string | "Documents" | The Weaviate collection to search |
| topK | number | 3 | Number of documents to retrieve |
| similarityThreshold | number | 0.7 | Minimum similarity score (0-1) |
| temperature | number | 0.7 | Text generation temperature |
| maxTokens | number | 1000 | Maximum tokens for generated response |
| promptTemplate | string | (built-in) | Custom prompt template with {{context}} and {{query}} placeholders |
| includeMetadata | boolean | false | Whether to include document metadata in context |
| filters | object | {} | Metadata filters for retrieval |

## Response Structure

The RAG tool returns a structured response containing:

```javascript
{
  answer: "The generated text response...",
  context: [
    {
      id: "doc-id-1",
      content: "Document content...",
      metadata: { /* Document metadata */ },
      score: 0.92
    },
    // More retrieved documents
  ],
  metadata: {
    retrievalCount: 3,
    usedFallback: false,
    topScore: 0.92
  }
}
```

## Integrating with Other Systems

The RAG tool can be integrated with various components of Agent Nexus:

- **Action System**: Use RAG to answer questions during plan execution
- **Memory System**: Store generated answers in long-term memory
- **Planning System**: Use RAG for information gathering during plan creation
- **Web UI**: Present the generated answers with source citations

## Advanced Implementations

For more specialized RAG implementations, consider:

- **Multi-stage RAG**: Decompose complex queries into sub-queries
- **Hybrid search**: Combine semantic and keyword search
- **Reranking**: Use a secondary model to rerank retrieved documents
- **Few-shot RAG**: Include examples in the prompt template
- **Recursive RAG**: Use multiple rounds of retrieval and generation

## Performance Optimization

For production use:

- Implement caching of similar queries
- Use efficient document chunking strategies
- Optimize vector search parameters
- Consider using streaming responses for longer outputs
