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
  
  constructor() {
    this.shortTerm = new ShortTermMemory();
    this.longTerm = new LongTermMemory();
  }
  
  /**
   * Store data in memory
   * 
   * @param data The data to store
   * @param memoryType Where to store the data (short-term, long-term, or both)
   */
  store(data: any, memoryType: MemoryType = 'both'): void {
    // Convert simple data to memory entry if needed
    const entry: MemoryEntry = this.normalizeEntry(data);
    
    if (memoryType === 'short' || memoryType === 'both') {
      this.shortTerm.store(entry);
    }
    
    if (memoryType === 'long' || memoryType === 'both') {
      this.longTerm.store(entry);
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
    
    if (memoryType === 'short' || memoryType === 'both') {
      const shortTermResults = await this.shortTerm.retrieve(query);
      results.push(...shortTermResults);
    }
    
    if (memoryType === 'long' || memoryType === 'both') {
      const longTermResults = await this.longTerm.retrieve(query);
      results.push(...longTermResults);
    }
    
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
}
