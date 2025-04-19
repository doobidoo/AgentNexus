# Vector Search Tool

The VectorSearch tool enables semantic similarity search capabilities in Agent Nexus using Weaviate as the underlying vector database.

## Setup Instructions

### 1. Configure Environment Variables

Add the following to your `.env.local` file:

```
WEAVIATE_HOST=localhost:8080
WEAVIATE_SCHEME=http
WEAVIATE_API_KEY=  # Optional if you're using authentication
```

### 2. Start Weaviate

Start Weaviate using Docker Compose:

```bash
docker-compose up -d weaviate
```

This will launch Weaviate on `localhost:8080`. Verify it's running with:

```bash
curl http://localhost:8080/v1/meta
```

## Usage Examples

### Basic Search

```javascript
const searchResults = await vectorSearch.execute({
  tool: 'vectorSearch',
  params: {
    query: 'How does the memory system work?',
    collection: 'Documents',
    topK: 5,
    similarityThreshold: 0.7
  }
});

console.log(searchResults.data); // Array of matching documents with scores
```

### Adding Documents

```javascript
const documents = [
  { 
    content: 'Document content here', 
    metadata: { source: 'manual', category: 'guide' } 
  },
  // More documents...
];

await vectorSearch.addDocuments(documents, 'MyCollection');
```

### Search with Filters

```javascript
const filteredResults = await vectorSearch.execute({
  tool: 'vectorSearch',
  params: {
    query: 'How to configure the system?',
    collection: 'Documents',
    topK: 10,
    filters: {
      category: 'configuration',
      source: 'documentation'
    }
  }
});
```

## Key Features

- **Semantic search**: Find conceptually similar content even when keywords don't match
- **Collection management**: Create and manage different document collections
- **Filtering**: Filter results based on metadata properties
- **Fault tolerance**: Built-in retry logic and error handling
- **Configurable**: Adjust similarity thresholds, result limits, and more

## Implementation Details

The VectorSearch tool includes:

- **Environment-based configuration**: Uses environment variables instead of hardcoded values
- **Connection status management**: Checks and monitors connection to Weaviate
- **Retry logic**: Automatically retries failed operations with exponential backoff
- **Graceful shutdown**: Properly cleans up resources when shutting down
- **Error handling**: Comprehensive error handling and reporting

## Testing the Tool

### Unit Tests

Run the unit tests with:

```bash
npm test -- --testPathPattern=vector-search
```

### Integration Tests

For integration tests that require a running Weaviate instance:

```bash
# Start Weaviate first
docker-compose up -d weaviate

# Run integration tests
RUN_INTEGRATION_TESTS=true npm test -- --testPathPattern=vector-search.integration
```

## Integration with Text Generation

VectorSearch is designed to work seamlessly with the TextGeneration tool to implement the Retrieval Augmented Generation (RAG) pattern:

1. Use VectorSearch to find relevant documents based on a query
2. Extract and format the content from the search results
3. Include the retrieved content as context for the TextGeneration tool
4. Generate a response that incorporates the retrieved information

Example:

```javascript
// 1. Search for relevant information
const searchResults = await vectorSearch.execute({
  tool: 'vectorSearch',
  params: { query: userQuestion, topK: 3 }
});

// 2. Extract and format context
const context = searchResults.data
  .map(doc => doc.content)
  .join('\n\n');

// 3. Generate response with context
const response = await textGeneration.execute({
  tool: 'textGeneration',
  params: {
    prompt: `
      Based on the following information:
      
      ${context}
      
      Answer this question: ${userQuestion}
    `,
    temperature: 0.3
  }
});
```

## Optimizations

For production use, consider these optimizations:

- **Connection pooling**: Reuse connections to Weaviate for better performance
- **Caching**: Implement a caching layer for frequent queries
- **Batch processing**: Process large document sets in batches
- **Index optimization**: Configure Weaviate index settings for your specific data

## Troubleshooting

If you encounter issues with the VectorSearch tool:

1. Verify Weaviate is running: `curl http://localhost:8080/v1/meta`
2. Check environment variables are correctly set
3. Look for connection errors in the logs
4. Ensure data is being properly indexed
5. Test with simple queries first
