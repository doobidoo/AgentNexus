/**
 * Short-Term Memory for Agent Nexus
 * 
 * Maintains conversation context and immediate task information with
 * configurable retention parameters and priority-based management.
 */

import { Memory } from 'agno';
import { MemoryEntry } from './index';

export interface ShortTermMemoryConfig {
  maxSize?: number;
  retentionPeriod?: number; // In milliseconds
}

export class ShortTermMemory {
  private memory: Memory;
  private entries: MemoryEntry[];
  private maxSize: number;
  private retentionPeriod: number; // In milliseconds
  
  constructor(config: ShortTermMemoryConfig = {}) {
    // Initialize Agno memory component
    this.memory = new Memory();
    
    // Initialize internal memory structure
    this.entries = [];
    this.maxSize = config.maxSize || 100;
    this.retentionPeriod = config.retentionPeriod || 24 * 60 * 60 * 1000; // Default 24 hours
  }
  
  /**
   * Store a memory entry in short-term memory
   * 
   * @param entry The memory entry to store
   */
  store(entry: MemoryEntry): void {
    // Add entry to internal storage
    this.entries.push(entry);
    
    // Also store in Agno memory if content is string
    if (typeof entry.content === 'string') {
      this.memory.add(entry.content);
    } else if (entry.role === 'user' && typeof entry.content === 'string') {
      this.memory.add(`User: ${entry.content}`);
    } else if (entry.role === 'assistant' && typeof entry.content === 'string') {
      this.memory.add(`Assistant: ${entry.content}`);
    }
    
    // Prune old entries if needed
    this.pruneEntries();
  }
  
  /**
   * Retrieve entries from short-term memory based on query
   * 
   * @param query The search query
   * @returns Array of matching memory entries
   */
  async retrieve(query: string): Promise<MemoryEntry[]> {
    // Simple search implementation - will be enhanced in future versions
    const now = new Date().getTime();
    
    // Filter by retention period and then by query match
    return this.entries.filter(entry => {
      // Check if entry is within retention period
      const entryTime = new Date(entry.timestamp).getTime();
      const isWithinRetention = (now - entryTime) <= this.retentionPeriod;
      
      // Check if entry matches query (simple contains check)
      let contentString = '';
      
      if (typeof entry.content === 'string') {
        contentString = entry.content;
      } else if (entry.content && typeof entry.content === 'object') {
        contentString = JSON.stringify(entry.content);
      }
      
      const matchesQuery = contentString.toLowerCase().includes(query.toLowerCase());
      
      return isWithinRetention && matchesQuery;
    });
  }
  
  /**
   * Get all entries in short-term memory
   * 
   * @returns Array of all memory entries
   */
  getAll(): MemoryEntry[] {
    return [...this.entries];
  }
  
  /**
   * Clear all entries from short-term memory
   */
  clear(): void {
    this.entries = [];
    // Also clear Agno memory
    // Note: Agno Memory doesn't have a clear method currently,
    // this will need to be revisited when available
  }
  
  /**
   * Remove old entries based on retention period and max size
   */
  private pruneEntries(): void {
    const now = new Date().getTime();
    
    // Remove entries older than retention period
    this.entries = this.entries.filter(entry => {
      const entryTime = new Date(entry.timestamp).getTime();
      return (now - entryTime) <= this.retentionPeriod;
    });
    
    // If still over max size, remove oldest entries (keeping high priority ones)
    if (this.entries.length > this.maxSize) {
      // Sort by priority (higher first) and then by timestamp (newer first)
      this.entries.sort((a, b) => {
        if ((b.priority || 0) !== (a.priority || 0)) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      // Keep only the top maxSize entries
      this.entries = this.entries.slice(0, this.maxSize);
    }
  }
}
