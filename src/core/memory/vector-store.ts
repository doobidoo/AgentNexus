/**
 * Vector Store for Advanced Memory Retrieval
 * 
 * Implements in-memory vector storage for semantic search capabilities.
 * This is a simplified version that will eventually be connected to a
 * proper vector database for production use.
 */

import { ModelProvider } from '../models/base';
import { modelManager } from '../models/factory';
import { MemoryEntry } from './index';
import { ChromaClient } from './chromadb-client';

export interface VectorStoreConfig {
  dimensions?: number;
  modelProvider?: ModelProvider | string;
  useChroma?: boolean;
  chromaConfig?: {
    serviceUrl: string;
    collectionName: string;
  };
}

export interface VectorEntry {
  id: string;
  vector: number[];
  entry: MemoryEntry;
}

export class VectorStore {
  private entries: VectorEntry[] = [];
  private dimensions: number;
  private modelProvider!: ModelProvider; // Using definite assignment assertion
  private initialized: boolean = false;
  private initPromise: Promise<void>;
  private useChroma: boolean = false;
  private chromaClient: any = null;
  private chromaConfig: {
    serviceUrl: string;
    collectionName: string;
  } | null = null;
  
  constructor(config: VectorStoreConfig = {}) {
    this.dimensions = config.dimensions || 1536; // Default is OpenAI embedding size
    this.useChroma = config.useChroma || false;
    
    // Save ChromaDB configuration if provided
    if (this.useChroma && config.chromaConfig) {
      this.chromaConfig = config.chromaConfig;
    }
    
    // Initialize with a placeholder promise that resolves immediately
    this.initPromise = this.initialize(config);
  }
  
  /**
   * Initialize the vector store with the given configuration
   */
  private async initialize(config: VectorStoreConfig): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Get model provider with embedding capability
      if (typeof config.modelProvider === 'string') {
        this.modelProvider = modelManager.getProvider(config.modelProvider);
      } else if (config.modelProvider) {
        this.modelProvider = config.modelProvider;
      } else {
        // Find first provider with embedding capability
        const providers = modelManager.listProviders();
        const embeddingProvider = providers.find(
          providerName => modelManager.getProvider(providerName).getInfo().capabilities.embeddings
        );
        
        if (embeddingProvider) {
          this.modelProvider = modelManager.getProvider(embeddingProvider);
        } else {
          // Fall back to default provider
          this.modelProvider = modelManager.getProvider();
          console.warn('No provider with embedding capability found. Using default provider.');
        }
      }
      
      // Initialize ChromaDB if enabled
      if (this.useChroma && this.chromaConfig) {
        try {
          // Create ChromaDB client
          this.chromaClient = new ChromaClient({
            serviceUrl: this.chromaConfig.serviceUrl,
            collectionName: this.chromaConfig.collectionName
          });
          
          // Initialize client and collection
          const initialized = await this.chromaClient.initialize();
          if (!initialized) {
            console.error('Failed to initialize ChromaDB client, falling back to in-memory storage');
            this.useChroma = false;
          } else {
            console.log('ChromaDB client initialized successfully');
          }
        } catch (err) {
          console.error('Failed to initialize ChromaDB:', err);
          this.useChroma = false; // Fallback to in-memory storage
        }
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      // Use default provider as fallback
      this.modelProvider = modelManager.getProvider();
      this.initialized = true;
    }
  }
  
  /**
   * Ensure the vector store is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initPromise;
    }
  }
  
  /**
   * Add an entry to the vector store
   * 
   * @param entry The memory entry to add
   * @returns The generated vector entry ID
   */
  async addEntry(entry: MemoryEntry): Promise<string> {
    await this.ensureInitialized();
    
    try {
      // Convert entry to string for embedding
      let textToEmbed = this.entryToString(entry);
      
      // Generate embedding
      const vector = await this.generateEmbedding(textToEmbed);
      
      // Create unique ID if not provided
      const id = entry.id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Entry with guaranteed ID
      const entryWithId = {
        ...entry,
        id
      };
      
      // Store in ChromaDB if enabled
      if (this.useChroma && this.chromaClient) {
        try {
          // Convert to ChromaDB entry format
          const chromaEntry = ChromaClient.memoryEntryToChromaEntry(entryWithId, vector);
          
          // Add to ChromaDB
          const success = await this.chromaClient.addEntries([chromaEntry]);
          if (!success) {
            console.warn('Failed to add entry to ChromaDB, falling back to in-memory storage');
          }
        } catch (err) {
          console.error('Failed to add to ChromaDB, falling back to in-memory storage:', err);
          // Continue with in-memory storage as fallback
        }
      }
      
      // Always store in-memory (as backup or primary storage)
      this.entries.push({
        id,
        vector,
        entry: entryWithId
      });
      
      return id;
    } catch (error) {
      console.error('Failed to add entry to vector store:', error);
      
      // Create a fallback entry with random vector
      const id = entry.id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const randomVector = Array(this.dimensions).fill(0).map(() => Math.random() * 2 - 1);
      
      this.entries.push({
        id,
        vector: randomVector,
        entry: {
          ...entry,
          id
        }
      });
      
      return id;
    }
  }
  
  /**
   * Find similar entries using vector similarity
   * 
   * @param query The search query
   * @param limit Maximum number of results
   * @param threshold Similarity threshold (0-1)
   * @returns Array of matching entries with similarity scores
   */
  async findSimilar(query: string, limit = 5, threshold = 0.7): Promise<Array<{entry: MemoryEntry, score: number}>> {
    await this.ensureInitialized();
    
    // Check if ChromaDB should be used
    if (this.useChroma && this.chromaClient) {
      try {
        // Generate query embedding
        const queryVector = await this.generateEmbedding(query);
        
        // Query ChromaDB
        const results = await this.chromaClient.query({
          queryEmbeddings: [queryVector],
          nResults: limit
        });
        
        if (results && results.ids.length > 0) {
          // Convert to memory entries
          const entries = results.ids[0].map((id, index) => {
            const metadata = results.metadatas[0][index];
            const document = results.documents[0][index];
            const embedding = results.embeddings[0][index];
            const distance = results.distances[0][index];
            
            // Convert distance to similarity score (1 - normalized distance)
            const score = 1 - Math.min(distance / 2, 1);
            
            // Skip entries below threshold
            if (score < threshold) {
              return null;
            }
            
            const entry = ChromaClient.chromaEntryToMemoryEntry(
              id,
              metadata,
              document,
              embedding,
              distance
            );
            
            return { entry, score };
          }).filter(result => result !== null) as Array<{entry: MemoryEntry, score: number}>;
          
          // Sort by score (highest first)
          return entries.sort((a, b) => b.score - a.score);
        }
        
        // Fall back to in-memory search if no results
        console.log('No results from ChromaDB, falling back to in-memory search');
      } catch (chromaError) {
        console.error('ChromaDB query failed, falling back to in-memory search:', chromaError);
        // Continue with in-memory search
      }
    }
    
    // In-memory search (fallback or primary if ChromaDB not enabled)
    // If no entries, return empty array
    if (this.entries.length === 0) {
      return [];
    }
    
    try {
      // Generate query embedding
      const queryVector = await this.generateEmbedding(query);
      
      // Calculate similarity for all entries
      const results = this.entries.map(entry => {
        const score = this.cosineSimilarity(queryVector, entry.vector);
        return {
          entry: entry.entry,
          score
        };
      });
      
      // Filter by threshold and sort by score (descending)
      return results
        .filter(result => result.score >= threshold)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in vector similarity search:', error);
      // Fall back to keyword search
      console.log('Falling back to keyword search');
      return this.keywordFallbackSearch(query, limit);
    }
  }
  
  /**
   * Remove an entry from the vector store
   * 
   * @param id ID of the entry to remove
   * @returns True if entry was removed, false if not found
   */
  async removeEntry(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    // Remove from ChromaDB if enabled
    if (this.useChroma && this.chromaClient) {
      try {
        // Delete from ChromaDB
        await this.chromaClient.deleteEntries([id]);
      } catch (err) {
        console.error('Failed to remove from ChromaDB:', err);
        // Continue with in-memory removal regardless
      }
    }
    
    // Remove from in-memory storage
    const initialLength = this.entries.length;
    this.entries = this.entries.filter(entry => entry.id !== id);
    return initialLength > this.entries.length;
  }
  
  /**
   * Get all entries in the vector store
   * 
   * @returns Array of all vector entries
   */
  getAllEntries(): VectorEntry[] {
    return [...this.entries];
  }
  
  /**
   * Clear all entries from the vector store
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();
    
    // Clear ChromaDB if enabled
    if (this.useChroma && this.chromaClient) {
      try {
        // Delete and recreate the collection
        await this.chromaClient.deleteCollection();
        await this.chromaClient.initialize();
      } catch (err) {
        console.error('Failed to clear ChromaDB collection:', err);
      }
    }
    
    // Clear in-memory storage
    this.entries = [];
  }
  
  /**
   * Generate embedding for text
   * 
   * @param text Text to embed
   * @returns Embedding vector
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Check if model provider has embedding capability
      if (!this.modelProvider.getInfo().capabilities.embeddings) {
        return this.generateRandomEmbedding();
      }
      
      // Generate embedding
      const embedding = await this.modelProvider.generateEmbeddings(text);
      
      // Handle array of embeddings (should be a single embedding)
      if (Array.isArray(embedding) && embedding.length > 0 && Array.isArray(embedding[0])) {
        return embedding[0];
      }
      
      return embedding as number[];
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      // Return a random embedding as fallback
      return this.generateRandomEmbedding();
    }
  }
  
  /**
   * Generate a random embedding for fallback purposes
   * 
   * @returns Random embedding vector
   */
  private generateRandomEmbedding(): number[] {
    return Array(this.dimensions).fill(0).map(() => Math.random() * 2 - 1);
  }
  
  /**
   * Calculate cosine similarity between two vectors
   * 
   * @param a First vector
   * @param b Second vector
   * @returns Similarity score (0-1)
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimensions do not match: ${a.length} vs ${b.length}`);
    }
    
    let dotProduct = 0;
    let aMagnitude = 0;
    let bMagnitude = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      aMagnitude += a[i] * a[i];
      bMagnitude += b[i] * b[i];
    }
    
    aMagnitude = Math.sqrt(aMagnitude);
    bMagnitude = Math.sqrt(bMagnitude);
    
    if (aMagnitude === 0 || bMagnitude === 0) {
      return 0;
    }
    
    return dotProduct / (aMagnitude * bMagnitude);
  }
  
  /**
   * Convert a memory entry to string for embedding
   * 
   * @param entry Memory entry to convert
   * @returns String representation of the entry
   */
  private entryToString(entry: MemoryEntry): string {
    let result = '';
    
    // Handle content
    if (typeof entry.content === 'string') {
      result += entry.content;
    } else if (entry.content && typeof entry.content === 'object') {
      result += JSON.stringify(entry.content);
    }
    
    // Add role if present
    if (entry.role) {
      result = `${entry.role}: ${result}`;
    }
    
    // Add metadata if present
    if (entry.metadata) {
      result += ' ' + Object.entries(entry.metadata)
        .map(([key, value]) => `${key}: ${value}`)
        .join(' ');
    }
    
    return result;
  }
  
  /**
   * Fallback search using keywords when vector search fails
   * 
   * @param query The search query
   * @param limit Maximum number of results
   * @returns Array of matching entries with arbitrary scores
   */
  private keywordFallbackSearch(query: string, limit = 5): Array<{entry: MemoryEntry, score: number}> {
    const keywords = query.toLowerCase().split(/\s+/);
    
    // Match entries that contain any of the keywords
    return this.entries
      .map(vectorEntry => {
        const entryText = this.entryToString(vectorEntry.entry).toLowerCase();
        
        // Calculate a simple score based on keyword occurrence
        let score = 0;
        for (const keyword of keywords) {
          if (entryText.includes(keyword)) {
            score += 1;
          }
        }
        
        // Normalize score to 0-1 range
        score = Math.min(score / keywords.length, 1);
        
        return {
          entry: vectorEntry.entry,
          score
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}