/**
 * Memory System for Agent Nexus
 * 
 * The memory system is divided into short-term (immediate context) and
 * long-term (persistent knowledge) components, allowing the agent to
 * maintain continuity across interactions.
 */

import { ShortTermMemory } from './short-term';
import { LongTermMemory } from './long-term';

export type MemoryType = 'short' | 'long' | 'both';

export interface MemoryEntry {
  content?: any;
  timestamp: string;
  metadata?: Record<string, any>;
  priority?: number;
  id?: string;
  [key: string]: any;
}

export class MemorySystem {
  shortTerm: ShortTermMemory;
  longTerm: LongTermMemory;
  
  constructor(config = {
    useChroma: false,
    chromaConfig: {
      serviceUrl: 'http://localhost:8000',
      collectionName: 'agent_nexus_memory'
    }
  }) {
    this.shortTerm = new ShortTermMemory();
    this.longTerm = new LongTermMemory({
      useChroma: config.useChroma,
      chromaConfig: config.chromaConfig
    });
  }
  
  /**
   * Store data in memory
   * 
   * @param data The data to store
   * @param memoryType Where to store the data (short-term, long-term, or both)
   * @returns Promise that resolves when storage is complete
   */
  async store(data: any, memoryType: MemoryType = 'both'): Promise<void> {
    // Convert simple data to memory entry if needed
    const entry: MemoryEntry = this.normalizeEntry(data);
    
    // Generate a unique ID if not present
    if (!entry.id) {
      entry.id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Create an array to hold all promises
    const promises: Promise<void>[] = [];
    
    // Store in short-term memory if needed
    if (memoryType === 'short' || memoryType === 'both') {
      this.shortTerm.store(entry);
    }
    
    // Store in long-term memory if needed
    if (memoryType === 'long' || memoryType === 'both') {
      // Long-term storage is async, so we need to add it to promises
      const longTermPromise = this.longTerm.store(entry);
      promises.push(longTermPromise);
    }
    
    // Wait for all async operations to complete
    if (promises.length > 0) {
      await Promise.all(promises);
    }
  }
  
  /**
   * Retrieve data from memory based on query
   * 
   * @param query The search query
   * @param memoryType Where to search (short-term, long-term, or both)
   * @returns Retrieved memory entries
   */
  async retrieve(query: string, memoryType: MemoryType = 'both'): Promise<MemoryEntry[]> {
    const results: MemoryEntry[] = [];
    const promises: Promise<void>[] = [];
    
    // Retrieve from short-term memory if needed
    if (memoryType === 'short' || memoryType === 'both') {
      const shortTermPromise = this.shortTerm.retrieve(query).then(entries => {
        results.push(...entries);
      });
      promises.push(shortTermPromise);
    }
    
    // Retrieve from long-term memory if needed
    if (memoryType === 'long' || memoryType === 'both') {
      const longTermPromise = this.longTerm.retrieve(query).then(entries => {
        results.push(...entries);
      });
      promises.push(longTermPromise);
    }
    
    // Wait for all async operations to complete
    await Promise.all(promises);
    
    return results;
  }
  
  /**
   * Convert any data to a properly formatted memory entry
   * 
   * @param data The data to normalize
   * @returns A properly formatted memory entry
   */
  private normalizeEntry(data: any): MemoryEntry {
    if (typeof data !== 'object') {
      return {
        content: data,
        timestamp: new Date().toISOString(),
        priority: 5 // Default medium priority
      };
    }
    
    // If it's already a memory entry with timestamp, use it
    if (data.timestamp) {
      return data;
    }
    
    // Otherwise, wrap it in a memory entry
    return {
      ...data,
      timestamp: new Date().toISOString(),
      priority: data.priority || 5
    };
  }
  
  /**
   * Get all entries from both memory systems
   * 
   * @returns Object containing all memory entries
   */
  async getAllEntries(): Promise<{shortTerm: MemoryEntry[], longTerm: MemoryEntry[]}> {
    const shortTermEntries = this.shortTerm.getAll();
    const longTermEntries = await this.longTerm.getAll();
    
    return {
      shortTerm: shortTermEntries,
      longTerm: longTermEntries
    };
  }
}
