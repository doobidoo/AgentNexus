/**
 * RAG (Retrieval Augmented Generation) Tool
 * 
 * Combines VectorSearch and TextGeneration tools to implement 
 * retrieval-augmented generation capabilities.
 */

import { AbstractTool, ToolInput, ToolOutput } from './base';
import { VectorSearch } from './vector-search';
import { TextGeneration } from './text-generation';

export interface RAGParams {
  query: string;
  collection?: string;
  topK?: number;
  similarityThreshold?: number;
  temperature?: number;
  maxTokens?: number;
  promptTemplate?: string;
  includeMetadata?: boolean;
  filters?: Record<string, any>;
}

export class RAG extends AbstractTool {
  private vectorSearch: VectorSearch;
  private textGeneration: TextGeneration;
  private defaultPromptTemplate: string = `
    Please answer the following question based on the provided context.
    
    Context:
    {{context}}
    
    Question: {{query}}
    
    Answer:
  `;

  constructor(vectorSearch: VectorSearch, textGeneration: TextGeneration) {
    super(
      'rag',
      'Retrieval Augmented Generation combining vector search with text generation',
      ['rag', 'augmented generation', 'retrieval generation', 'context-aware generation'],
      '1.0.0'
    );

    this.vectorSearch = vectorSearch;
    this.textGeneration = textGeneration;
  }
  
  /**
   * Validate the RAG parameters
   */
  validate(input: ToolInput): boolean {
    const params = input.params as RAGParams;
    
    if (!params) return false;
    if (!params.query || typeof params.query !== 'string') return false;
    
    // Optional parameter validation
    if (params.topK !== undefined && (typeof params.topK !== 'number' || params.topK <= 0)) return false;
    if (params.similarityThreshold !== undefined && (typeof params.similarityThreshold !== 'number' || params.similarityThreshold < 0 || params.similarityThreshold > 1)) return false;
    if (params.temperature !== undefined && (typeof params.temperature !== 'number' || params.temperature < 0 || params.temperature > 2)) return false;
    if (params.maxTokens !== undefined && (typeof params.maxTokens !== 'number' || params.maxTokens <= 0)) return false;
    
    return true;
  }
  
  /**
   * Execute the RAG process with the provided parameters
   */
  async execute(input: ToolInput): Promise<ToolOutput> {
    try {
      // Validate input
      if (!this.validate(input)) {
        return this.createErrorOutput('Invalid input parameters', input);
      }
      
      const params = input.params as RAGParams;
      const { 
        query, 
        collection = 'Documents', 
        topK = 3, 
        similarityThreshold = 0.7,
        temperature = 0.7,
        maxTokens = 1000,
        promptTemplate,
        includeMetadata = false,
        filters = {}
      } = params;
      
      console.log(`RAG process started for query: "${query}"`);
      
      // Step 1: Retrieve relevant documents using VectorSearch
      const searchInput: ToolInput = {
        params: {
          query,
          collection,
          topK,
          similarityThreshold,
          filters
        },
        timestamp: new Date().toISOString(),
        requestId: input.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      };
      
      const searchResult = await this.vectorSearch.execute(searchInput);
      
      if (!searchResult.success) {
        return this.createErrorOutput(`Vector search failed: ${searchResult.error}`, input);
      }
      
      // If no results found, inform the user
      if (!searchResult.data || searchResult.data.length === 0) {
        // Fall back to direct text generation with a warning
        console.log('No relevant documents found, falling back to direct generation');
        
        const genInput: ToolInput = {
          params: {
            prompt: `Note: I don't have specific information about this in my knowledge base, but I'll try to answer based on my general knowledge.\n\n${query}`,
            temperature,
            maxTokens
          },
          timestamp: new Date().toISOString(),
          requestId: input.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
        };
        
        const genResult = await this.textGeneration.execute(genInput);
        
        if (!genResult.success) {
          return this.createErrorOutput(`Text generation failed: ${genResult.error}`, input);
        }
        
        return this.createSuccessOutput({
          answer: genResult.data,
          context: [],
          metadata: {
            retrievalCount: 0,
            usedFallback: true
          }
        }, input);
      }
      
      // Step 2: Format the context from retrieved documents
      const context = searchResult.data.map(item => {
        if (includeMetadata && item.metadata) {
          return `${item.content}\n(Source: ${JSON.stringify(item.metadata)})`;
        }
        return item.content;
      }).join('\n\n');
      
      // Step 3: Create the prompt for text generation
      const template = promptTemplate || this.defaultPromptTemplate;
      const prompt = template
        .replace('{{context}}', context)
        .replace('{{query}}', query);
      
      // Step 4: Generate text based on the context and query
      const genInput: ToolInput = {
        params: {
          prompt,
          temperature,
          maxTokens
        },
        timestamp: new Date().toISOString(),
        requestId: input.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
      };
      
      const genResult = await this.textGeneration.execute(genInput);
      
      if (!genResult.success) {
        return this.createErrorOutput(`Text generation failed: ${genResult.error}`, input);
      }
      
      // Step 5: Return the generated answer along with metadata
      return this.createSuccessOutput({
        answer: genResult.data,
        context: searchResult.data,
        metadata: {
          retrievalCount: searchResult.data.length,
          usedFallback: false,
          topScore: searchResult.data[0].score
        }
      }, input);
    } catch (error) {
      console.error('Error in RAG execution:', error);
      return this.createErrorOutput(`RAG execution failed: ${error}`, input);
    }
  }
  
  /**
   * Manage the context window size by trimming context if needed
   * 
   * @param context The full context from retrieved documents
   * @param maxContextTokens Maximum number of tokens for context
   * @returns Trimmed context that fits within token limits
   */
  private manageContextWindow(context: string, maxContextTokens: number = 4000): string {
    // Simple token count approximation (words / 0.75)
    const wordCount = context.split(/\s+/).length;
    const estimatedTokens = Math.ceil(wordCount / 0.75);
    
    if (estimatedTokens <= maxContextTokens) {
      return context;
    }
    
    // If context is too large, trim it
    console.log(`Context too large (est. ${estimatedTokens} tokens), trimming to ~${maxContextTokens} tokens`);
    
    const words = context.split(/\s+/);
    const trimmedWordCount = Math.floor(maxContextTokens * 0.75);
    const trimmedContext = words.slice(0, trimmedWordCount).join(' ');
    
    return trimmedContext + "\n\n[Note: Some context was trimmed due to length constraints]";
  }
}
