/**
 * ChromaDB Client for Agent Nexus
 * 
 * This module provides integration with ChromaDB vector database.
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { MemoryEntry } from './index';

export interface ChromaConfig {
  serviceUrl: string;
  collectionName: string;
  apiKey?: string;
}

export interface ChromaVectorEntry {
  id: string;
  embedding: number[];
  metadata: Record<string, any>;
  document: string;
}

export interface ChromaQueryResult {
  ids: string[];
  embeddings: number[][];
  metadatas: Record<string, any>[];
  documents: string[];
  distances: number[];
}

export interface ChromaQueryParams {
  queryEmbeddings: number[][];
  nResults?: number;
  where?: Record<string, any>;
  whereDocument?: Record<string, any>;
}

/**
 * ChromaDB Client for vector operations
 */
export class ChromaClient {
  private client: AxiosInstance;
  private collectionName: string;
  private apiPath: string = '/api/v1';
  private collection: any = null;
  private initialized: boolean = false;

  /**
   * Create a new ChromaDB client
   */
  constructor(private config: ChromaConfig) {
    this.collectionName = config.collectionName;
    
    const axiosConfig: AxiosRequestConfig = {
      baseURL: config.serviceUrl,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (config.apiKey) {
      axiosConfig.headers = {
        ...axiosConfig.headers,
        'Authorization': `Bearer ${config.apiKey}`
      };
    }
    
    this.client = axios.create(axiosConfig);
  }

  /**
   * Initialize the ChromaDB client
   */
  async initialize(): Promise<boolean> {
    try {
      await this.client.get(`${this.apiPath}/heartbeat`);
      const collection = await this.getOrCreateCollection(this.collectionName);
      if (collection) {
        this.collection = collection;
        this.initialized = true;
        console.log(`ChromaDB collection "${this.collectionName}" is ready.`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to initialize ChromaDB client:', error);
      return false;
    }
  }

  /**
   * Get or create a collection
   */
  private async getOrCreateCollection(name: string): Promise<any> {
    try {
      const response = await this.client.get(`${this.apiPath}/collections/${name}`);
      return response.data;
    } catch (error) {
      if ((error as any)?.response?.status === 404) {
        try {
          const response = await this.client.post(`${this.apiPath}/collections`, {
            name,
            metadata: { 'hnsw:space': 'cosine' }
          });
          return response.data;
        } catch (createError) {
          console.error('Failed to create collection:', createError);
          return null;
        }
      } else {
        console.error('Failed to get collection:', error);
        return null;
      }
    }
  }
  
  /**
   * Add items to the collection
   * @param entries Entries to add
   * @returns True if successful, false otherwise
   */
  async addEntries(entries: ChromaVectorEntry[]): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.initialized || entries.length === 0) {
      return false;
    }
    
    try {
      // Format data for ChromaDB
      const ids = entries.map(e => e.id);
      const embeddings = entries.map(e => e.embedding);
      const metadatas = entries.map(e => e.metadata);
      const documents = entries.map(e => e.document);
      
      await this.client.post(`${this.apiPath}/collections/${this.collectionName}/add`, {
        ids,
        embeddings,
        metadatas,
        documents
      });
      
      return true;
    } catch (error) {
      console.error('Failed to add entries to ChromaDB:', error);
      return false;
    }
  }

  /**
   * Query the collection for similar entries
   * @param params Query parameters
   * @returns Query results
   */
  async query(params: ChromaQueryParams): Promise<ChromaQueryResult | null> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.initialized) {
      return null;
    }
    
    try {
      const response = await this.client.post(
        `${this.apiPath}/collections/${this.collectionName}/query`, 
        params
      );
      
      return response.data;
    } catch (error) {
      console.error('Failed to query ChromaDB:', error);
      return null;
    }
  }

  /**
   * Delete entries from the collection
   * @param ids IDs of entries to delete
   * @returns True if successful, false otherwise
   */
  async deleteEntries(ids: string[]): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    if (!this.initialized || ids.length === 0) {
      return false;
    }
    
    try {
      await this.client.post(`${this.apiPath}/collections/${this.collectionName}/delete`, {
        ids
      });
      
      return true;
    } catch (error) {
      console.error('Failed to delete entries from ChromaDB:', error);
      return false;
    }
  }

  /**
  * Delete the collection
  * @returns True if successful, false otherwise
  */
  async deleteCollection(): Promise<boolean> {
  if (!this.initialized) {
  await this.initialize();
  }
  
  if (!this.initialized) {
  return false;
  }
  
  try {
  await this.client.delete(`${this.apiPath}/collections/${this.collectionName}`);
  this.initialized = false;
  this.collection = null;
  return true;
  } catch (error) {
  console.error('Failed to delete ChromaDB collection:', error);
  return false;
  }
  }

  /**
   * Convert a memory entry to a ChromaDB entry
   * @param entry Memory entry
   * @param vector Vector embedding
   * @returns ChromaDB entry
   */
  static memoryEntryToChromaEntry(entry: MemoryEntry, vector: number[]): ChromaVectorEntry {
    // Convert memory entry content to string for storage
    let documentContent = '';
    if (typeof entry.content === 'string') {
      documentContent = entry.content;
    } else if (entry.content && typeof entry.content === 'object') {
      documentContent = JSON.stringify(entry.content);
    }
    
    // Clean and format metadata
    const metadata: Record<string, any> = {
      ...entry,
      // Remove fields that will be stored separately
      content: undefined,
      id: undefined
    };
    
    return {
      id: entry.id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      embedding: vector,
      metadata,
      document: documentContent
    };
  }

  /**
   * Convert a ChromaDB entry to a memory entry
   * @param id ID of the entry
   * @param metadata Metadata of the entry
   * @param document Document content
   * @param embedding Vector embedding
   * @param distance Similarity distance (optional)
   * @returns Memory entry
   */
  static chromaEntryToMemoryEntry(
    id: string,
    metadata: Record<string, any>,
    document: string,
    embedding: number[],
    distance?: number
  ): MemoryEntry {
    let content: any = document;
    
    // Try to parse JSON content
    if (typeof document === 'string') {
      try {
        const parsed = JSON.parse(document);
        if (parsed && typeof parsed === 'object') {
          content = parsed;
        }
      } catch (_) {
        // If parsing fails, keep as string
        content = document;
      }
    }
    
    // Create memory entry
    const entry: MemoryEntry = {
      id,
      content,
      timestamp: metadata.timestamp || new Date().toISOString(),
      priority: metadata.priority || 5,
      metadata: {
        ...metadata,
        distance  // Add distance for ranking
      }
    };
    
    return entry;
  }
}
