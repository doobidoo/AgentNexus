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
  private client: WeaviateClient;
  private defaultCollection: string = 'Documents';

  constructor() {
    super(
      'vectorSearch',
      'Search for semantically similar content using vector embeddings',
      ['semantic search', 'vector similarity', 'content retrieval'],
      '1.0.0'
    );

    // Initialize Weaviate client
    this.client = weaviate.client({
      scheme: 'http',
      host: 'localhost:8080',
    });
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
    } catch (error) {
      console.error('Error in vector search:', error);
      return this.createErrorOutput(`Vector search failed: ${error}`, input);
    }
  }

  /**
   * Initialize a collection in Weaviate
   */
  async initializeCollection(collectionName: string = this.defaultCollection): Promise<void> {
    try {
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
      }
    } catch (error) {
      console.error(`Error initializing collection: ${error}`);
      throw error;
    }
  }

  /**
   * Add documents to the vector store
   */
  async addDocuments(documents: { content: string; metadata?: Record<string, any> }[], collection: string = this.defaultCollection): Promise<void> {
    try {
      // Ensure collection exists
      await this.initializeCollection(collection);

      // Add documents in batches
      const batchSize = 100;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
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
      }

      console.log(`Added ${documents.length} documents to collection: ${collection}`);
    } catch (error) {
      console.error(`Error adding documents: ${error}`);
      throw error;
    }
  }
}