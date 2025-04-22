/**
 * VectorSearch Tool for Agent Nexus
 * 
 * Performs semantic similarity search using vector embeddings via Weaviate.
 */

import { AbstractTool, ToolInput, ToolOutput } from './base';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';

export interface VectorSearchParams {
  query: string;
  collection?: string;
  topK?: number;
  similarityThreshold?: number;
  filters?: Record<string, any>;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  score: number;
}

export class VectorSearch extends AbstractTool {
  private client!: WeaviateClient; // Use definite assignment assertion
  private defaultCollection: string = 'Documents';
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'connecting';

  constructor() {
    super(
      'vectorSearch',
      'Search for semantically similar content using vector embeddings',
      ['semantic search', 'vector similarity', 'content retrieval'],
      '1.0.0'
    );

    // Check if Weaviate is enabled
    const enableWeaviate = process.env.ENABLE_WEAVIATE === 'true';
    
    // Get configuration from environment variables
    const host = process.env.WEAVIATE_HOST || 'localhost:8080';
    const scheme = process.env.WEAVIATE_SCHEME || 'http';
    const apiKey = process.env.WEAVIATE_API_KEY;
    
    // Register the required configuration
    const indexName = process.env.WEAVIATE_INDEX_NAME || process.env.NEXUS_TOOL_VECTORSEARCH_INDEXNAME || 'AgentNexus';
    
    // Register config with the ToolConfigManager
    if (typeof window === 'undefined') {
      try {
        // Dynamic import to avoid issues in browser environment
        const { configManager } = require('./config-manager');
        
        // Register configuration schema
        configManager.registerToolConfig(
          'vectorSearch',
          {
            properties: {
              indexName: {
                type: 'string',
                description: 'Name of the index/collection to use for vector storage',
                default: indexName
              },
              host: {
                type: 'string',
                description: 'Weaviate host address',
                default: host
              },
              scheme: {
                type: 'string',
                description: 'Weaviate connection scheme (http/https)',
                default: scheme
              },
              enabled: {
                type: 'boolean',
                description: 'Whether Weaviate integration is enabled',
                default: enableWeaviate
              }
            },
            required: ['indexName']
          },
          {
            indexName,
            host,
            scheme,
            enabled: enableWeaviate
          }
        );
      } catch (error) {
        console.error('Failed to register vector search configuration:', error);
      }
    }

    if (!enableWeaviate) {
      console.log('Weaviate integration is disabled. Set ENABLE_WEAVIATE=true to enable.');
      this.connectionStatus = 'disconnected';
      return;
    }

    // Initialize Weaviate client
    const clientConfig: any = {
      scheme,
      host,
    };
    
    // Add API key if provided
    if (apiKey) {
      clientConfig.apiKey = new weaviate.ApiKey(apiKey);
    }

    try {
      this.client = weaviate.client(clientConfig);
      
      // Check connection status
      this.checkConnection();
    } catch (error) {
      console.error('Failed to initialize Weaviate client:', error);
      this.connectionStatus = 'disconnected';
    }
  }
  
  /**
   * Validate the vector search parameters
   */
  validate(input: ToolInput): boolean {
    const params = input.params as VectorSearchParams;
    
    if (!params) return false;
    if (!params.query || typeof params.query !== 'string') return false;
    
    // Optional parameter validation
    if (params.topK !== undefined && (typeof params.topK !== 'number' || params.topK <= 0)) return false;
    if (params.similarityThreshold !== undefined && (typeof params.similarityThreshold !== 'number' || params.similarityThreshold < 0 || params.similarityThreshold > 1)) return false;
    
    return true;
  }
  
  /**
   * Execute vector search with the provided parameters
   */
  async execute(input: ToolInput): Promise<ToolOutput> {
    // Check if Weaviate is enabled via config manager
    let isEnabled = process.env.ENABLE_WEAVIATE === 'true';
    
    try {
      if (typeof window === 'undefined') {
        const { configManager } = require('./config-manager');
        const config = configManager.getToolConfig('vectorSearch');
        isEnabled = config.enabled === true;
      }
    } catch (error) {
      console.warn('Error accessing vector search configuration:', error);
    }
    
    // Return a graceful error if disabled
    if (!isEnabled) {
      return this.createErrorOutput('Weaviate integration is disabled. Set ENABLE_WEAVIATE=true to enable.', input);
    }
    
    // Check connection status before executing
    if (this.connectionStatus === 'disconnected') {
      const connected = await this.checkConnection();
      if (!connected) {
        return this.createErrorOutput('Weaviate connection is unavailable', input);
      }
    }

    try {
      // Validate input
      if (!this.validate(input)) {
        return this.createErrorOutput('Invalid input parameters', input);
      }
      
      const params = input.params as VectorSearchParams;
      const { 
        query, 
        collection = this.defaultCollection, 
        topK = 5, 
        similarityThreshold = 0.7,
        filters = {}
      } = params;
      
      console.log(`Searching for "${query}" in collection "${collection}"`);
      
      // Execute with retry logic
      return await this.withRetry(async () => {
        // Build the Weaviate query
        let queryBuilder = this.client.graphql
          .get()
          .withClassName(collection)
          .withNearText({ concepts: [query] })
          .withLimit(topK)
          .withFields('content metadata _additional { certainty }');

        // Add filters if specified
        if (Object.keys(filters).length > 0) {
          const whereFilter = Object.entries(filters).reduce((acc, [key, value]) => {
            acc[`metadata_${key}`] = { equals: value };
            return acc;
          }, {} as Record<string, any>);
          queryBuilder = queryBuilder.withWhere(whereFilter);
        }

        // Execute the search
        const result = await queryBuilder.do();

        if (!result.data || !result.data[collection]) {
          return this.createErrorOutput('No results found', input);
        }

        // Transform Weaviate results into our format
        const searchResults: VectorSearchResult[] = result.data[collection]
          .map((item: any) => ({
            id: item._additional.id,
            content: item.content,
            metadata: item.metadata,
            score: item._additional.certainty
          }))
          .filter((item: VectorSearchResult) => item.score >= similarityThreshold);

        return this.createSuccessOutput(searchResults, input);
      }, input);
    } catch (error) {
      console.error('Error in vector search:', error);
      return this.createErrorOutput(`Vector search failed: ${error}`, input);
    }
  }

  /**
   * Initialize a collection in Weaviate
   */
  async initializeCollection(collectionName: string = this.defaultCollection): Promise<void> {
    // Check connection status before executing
    if (this.connectionStatus === 'disconnected') {
      const connected = await this.checkConnection();
      if (!connected) {
        throw new Error('Cannot initialize collection: Weaviate connection is unavailable');
      }
    }
    
    try {
      await this.withRetry(async () => {
        // Check if collection exists
        const schema = await this.client.schema.getter().do();
        const exists = schema.classes?.some(c => c.class === collectionName);

        if (!exists) {
          // Create the collection with appropriate schema
          await this.client.schema
            .classCreator()
            .withClass({
              class: collectionName,
              description: 'Collection for vector search documents',
              vectorizer: 'text2vec-transformers',
              properties: [
                {
                  name: 'content',
                  dataType: ['text'],
                  description: 'The main content of the document',
                },
                {
                  name: 'metadata',
                  dataType: ['object'],
                  description: 'Additional metadata about the document',
                }
              ],
            })
            .do();

          console.log(`Created collection: ${collectionName}`);
        } else {
          console.log(`Collection ${collectionName} already exists`);
        }
        
        return true; // Successful operation
      }, { 
        params: { action: 'initializeCollection', collection: collectionName },
        timestamp: new Date().toISOString(),
        requestId: `init-${collectionName}-${Date.now()}`
      });
    } catch (error) {
      console.error(`Error initializing collection: ${error}`);
      throw error;
    }
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(documents: { content: string; metadata?: Record<string, any> }[], collection: string = this.defaultCollection): Promise<void> {
    // Check connection status before executing
    if (this.connectionStatus === 'disconnected') {
      const connected = await this.checkConnection();
      if (!connected) {
        throw new Error('Weaviate connection is unavailable');
      }
    }

    try {
      // Ensure collection exists
      await this.initializeCollection(collection);

      // Add documents in batches
      const batchSize = 100;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(documents.length / batchSize);
        
        console.log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} documents)`);
        
        await this.withRetry(async () => {
          const batcher = this.client.batch.objectsBatcher();
          
          batch.forEach(doc => {
            batcher.withObject({
              class: collection,
              properties: {
                content: doc.content,
                metadata: doc.metadata || {}
              }
            });
          });

          await batcher.do();
          return true; // Successful operation
        }, { 
          params: { batchNumber, batchSize },
          timestamp: new Date().toISOString(),
          requestId: `batch-${collection}-${batchNumber}-${Date.now()}`
        });
      }

      console.log(`Added ${documents.length} documents to collection: ${collection}`);
    } catch (error) {
      console.error(`Error adding documents: ${error}`);
      throw error;
    }
  }

  /**
   * Check connection to the Weaviate server
   * @returns Promise resolving to connection status
   */
  private async checkConnection(): Promise<boolean> {
    // Skip check if client is not initialized or if Weaviate is disabled
    if (!this.client || process.env.ENABLE_WEAVIATE !== 'true') {
      this.connectionStatus = 'disconnected';
      return false;
    }
    
    try {
      // Try to access the schema as a simple connectivity check
      const meta = await this.client.misc.metaGetter().do();
      this.connectionStatus = 'connected';
      console.log(`Connected to Weaviate: ${meta.version}`);  
      return true;
    } catch (error) {
      this.connectionStatus = 'disconnected';
      console.error(`Failed to connect to Weaviate: ${error}`);
      return false;
    }
  }

  /**
   * Get the current connection status
   * @returns Current connection status
   */
  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  /**
   * Clean up resources when the service is shutting down
   */
  async shutdown(): Promise<void> {
    // Currently, the Weaviate TS client doesn't have a specific shutdown method,
    // but we can add any cleanup code here in the future
    console.log('VectorSearch tool shutting down');
  }

  /**
   * Utility method to implement retry logic for operations
   * 
   * @param operation The async operation to execute with retry logic
   * @param input Original tool input for error reporting
   * @param maxRetries Maximum number of retry attempts
   * @param initialDelayMs Initial delay in milliseconds
   * @returns Result of the operation or error output
   */
  private async withRetry<T>(
    operation: () => Promise<T>, 
    input: ToolInput,
    maxRetries: number = 3, 
    initialDelayMs: number = 500
  ): Promise<T | ToolOutput> {
    let lastError: any;
    let delay = initialDelayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // On any attempt after the first, log the retry
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt}/${maxRetries} for operation...`);
        }

        return await operation();
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, error);
        
        // If this was our last attempt, break out of the loop
        if (attempt >= maxRetries) {
          break;
        }

        // Wait before retrying (with exponential backoff)
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    // If we get here, all retries failed
    return this.createErrorOutput(
      `Operation failed after ${maxRetries + 1} attempts: ${lastError}`,
      input
    );
  }
}