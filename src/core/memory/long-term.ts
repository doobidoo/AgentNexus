/**
 * Long-Term Memory for Agent Nexus
 * 
 * Manages persistent knowledge that needs to be available across sessions.
 * Uses vector search for semantic retrieval and supports prioritization.
 */

import { MemoryEntry } from './index';
import { VectorStore } from './vector-store';
import { modelManager } from '../models/factory';

export interface LongTermMemoryConfig {
  maxEntries?: number;
  persistToLocalStorage?: boolean;
  localStorageKey?: string;
}

export class LongTermMemory {
  private entries: Map<string, MemoryEntry> = new Map();
  private vectorStore: VectorStore;
  private maxEntries: number;
  private persistToLocalStorage: boolean;
  private localStorageKey: string;
  private initialized: boolean = false;
  private initPromise: Promise<void>;
  
  constructor(config: LongTermMemoryConfig = {}) {
    this.maxEntries = config.maxEntries || 1000;
    this.persistToLocalStorage = config.persistToLocalStorage || false;
    this.localStorageKey = config.localStorageKey || 'agent_nexus_long_term_memory';
    
    // Find a provider with embedding capability
    const providers = modelManager.listProviders();
    const embeddingProvider = providers.find(
      providerName => modelManager.getProvider(providerName).getInfo().capabilities.embeddings
    );
    
    // Initialize vector store
    this.vectorStore = new VectorStore({
      modelProvider: embeddingProvider
    });
    
    // Initialize with a promise to ensure operations are properly sequenced
    this.initPromise = this.initialize();
  }
  
  /**
   * Initialize the long-term memory system
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Load from localStorage if enabled
      if (this.persistToLocalStorage) {
        await this.loadFromStorage();
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize long-term memory:', error);
      // Still mark as initialized to avoid hanging operations
      this.initialized = true;
    }
  }
  
  /**
   * Ensure the system is initialized before performing operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initPromise;
    }
  }
  
  /**
   * Store a memory entry in long-term memory
   * 
   * @param entry The memory entry to store
   */
  async store(entry: MemoryEntry): Promise<void> {
    await this.ensureInitialized();
    
    try {
      // Generate ID if not provided
      if (!entry.id) {
        entry.id = `ltm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      }
      
      // Store in map
      this.entries.set(entry.id, entry);
      
      // Add to vector store
      await this.vectorStore.addEntry(entry);
      
      // Prune if necessary
      if (this.entries.size > this.maxEntries) {
        await this.pruneEntries();
      }
      
      // Save to localStorage if enabled
      if (this.persistToLocalStorage) {
        await this.saveToStorage();
      }
    } catch (error) {
      console.error('Error storing in long-term memory:', error);
      
      // Still store in map even if vector store fails
      if (entry.id) {
        this.entries.set(entry.id, entry);
      }
    }
  }
  
  /**
   * Retrieve entries from long-term memory based on query
   * 
   * @param query The search query
   * @param limit Maximum number of results
   * @returns Array of matching memory entries
   */
  async retrieve(query: string, limit = 5): Promise<MemoryEntry[]> {
    await this.ensureInitialized();
    
    try {
      // Use vector store for semantic search
      const results = await this.vectorStore.findSimilar(query, limit);
      return results.map(result => result.entry);
    } catch (error) {
      console.error('Error in long-term memory retrieval:', error);
      
      // Fall back to simple text search
      return this.fallbackTextSearch(query, limit);
    }
  }
  
  /**
   * Get a specific memory entry by ID
   * 
   * @param id ID of the entry to retrieve
   * @returns The memory entry or undefined if not found
   */
  async getById(id: string): Promise<MemoryEntry | undefined> {
    await this.ensureInitialized();
    return this.entries.get(id);
  }
  
  /**
   * Remove a memory entry
   * 
   * @param id ID of the entry to remove
   * @returns True if entry was removed, false if not found
   */
  async remove(id: string): Promise<boolean> {
    await this.ensureInitialized();
    
    // Remove from map
    const removed = this.entries.delete(id);
    
    // Remove from vector store
    this.vectorStore.removeEntry(id);
    
    // Save to localStorage if enabled
    if (removed && this.persistToLocalStorage) {
      await this.saveToStorage();
    }
    
    return removed;
  }
  
  /**
   * Get all entries in long-term memory
   * 
   * @returns Array of all memory entries
   */
  async getAll(): Promise<MemoryEntry[]> {
    await this.ensureInitialized();
    return Array.from(this.entries.values());
  }
  
  /**
   * Clear all entries from long-term memory
   */
  async clear(): Promise<void> {
    await this.ensureInitialized();
    
    this.entries.clear();
    this.vectorStore.clear();
    
    // Clear localStorage if enabled
    if (this.persistToLocalStorage && typeof window !== 'undefined') {
      window.localStorage.removeItem(this.localStorageKey);
    }
  }
  
  /**
   * Save memory entries to localStorage
   */
  private async saveToStorage(): Promise<void> {
    if (typeof window === 'undefined') {
      return; // Not in browser environment
    }
    
    try {
      const data = Array.from(this.entries.values());
      window.localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save long-term memory to localStorage:', error);
    }
  }
  
  /**
   * Load memory entries from localStorage
   */
  private async loadFromStorage(): Promise<void> {
    if (typeof window === 'undefined') {
      return; // Not in browser environment
    }
    
    try {
      const data = window.localStorage.getItem(this.localStorageKey);
      if (data) {
        const entries = JSON.parse(data) as MemoryEntry[];
        
        // Process each entry
        const promises = entries.map(async (entry) => {
          if (entry.id) {
            this.entries.set(entry.id, entry);
            
            // Add to vector store
            try {
              await this.vectorStore.addEntry(entry);
            } catch (err) {
              console.error(`Failed to add entry ${entry.id} to vector store:`, err);
            }
          }
        });
        
        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Failed to load long-term memory from localStorage:', error);
    }
  }
  
  /**
   * Remove oldest and lowest priority entries when capacity is reached
   */
  private async pruneEntries(): Promise<void> {
    if (this.entries.size <= this.maxEntries) {
      return;
    }
    
    // Convert to array for sorting
    const entriesArray = Array.from(this.entries.values());
    
    // Sort by priority (higher first) and then by timestamp (newer first)
    entriesArray.sort((a, b) => {
      if ((b.priority || 0) !== (a.priority || 0)) {
        return (b.priority || 0) - (a.priority || 0);
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Keep only the top maxEntries entries
    const toKeep = entriesArray.slice(0, this.maxEntries);
    const toRemove = entriesArray.slice(this.maxEntries);
    
    // Update storage
    this.entries = new Map(toKeep.map(entry => [entry.id!, entry]));
    
    // Remove from vector store
    const removePromises = toRemove.map(entry => {
      if (entry.id) {
        return this.vectorStore.removeEntry(entry.id);
      }
      return Promise.resolve(false);
    });
    
    await Promise.all(removePromises);
    
    // Save to localStorage if enabled
    if (this.persistToLocalStorage) {
      await this.saveToStorage();
    }
  }
  
  /**
   * Fallback text search when vector search fails
   * 
   * @param query The search query
   * @param limit Maximum number of results
   * @returns Array of matching memory entries
   */
  private fallbackTextSearch(query: string, limit = 5): MemoryEntry[] {
    const queryLower = query.toLowerCase();
    const matches: MemoryEntry[] = [];
    
    for (const entry of this.entries.values()) {
      let contentString = '';
      
      if (typeof entry.content === 'string') {
        contentString = entry.content;
      } else if (entry.content && typeof entry.content === 'object') {
        contentString = JSON.stringify(entry.content);
      }
      
      if (contentString.toLowerCase().includes(queryLower)) {
        matches.push(entry);
        if (matches.length >= limit) {
          break;
        }
      }
    }
    
    return matches;
  }
}
