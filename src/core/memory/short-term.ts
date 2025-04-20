/**
 * Short-Term Memory for Agent Nexus
 * 
 * Maintains conversation context and immediate task information with
 * configurable retention parameters and priority-based management.
 */

// Define our own Memory interface to replace agno dependency
interface Memory {
  add: (content: string) => void;
}

import { MemoryEntry } from './index';

export interface ShortTermMemoryConfig {
  maxSize?: number;
  retentionPeriod?: number; // In milliseconds
  priorityLevels?: number; // Number of priority levels (1-10)
  contextWindowSize?: number; // Number of recent entries to keep in context
  autoSummarize?: boolean; // Whether to automatically summarize long conversations
  summarizationThreshold?: number; // Number of entries before summarization
}

export class ShortTermMemory {
  private memory: Memory;
  private entries: MemoryEntry[];
  private maxSize: number;
  private retentionPeriod: number; // In milliseconds
  private priorityLevels: number;
  private contextWindowSize: number;
  private autoSummarize: boolean;
  private summarizationThreshold: number;
  private conversationThreads: Map<string, MemoryEntry[]>;
  private accessCounts: Map<string, number>; // Track entry access counts for priority boosting
  
  constructor(config: ShortTermMemoryConfig = {}) {
    // Create a simple memory implementation
    this.memory = {
      add: (content: string) => {
        console.log('Memory content added:', content.substring(0, 50) + '...');
        // In a real implementation, this would add to the agno Memory
      }
    };
    
    // Initialize internal memory structure
    this.entries = [];
    this.maxSize = config.maxSize || 100;
    this.retentionPeriod = config.retentionPeriod || 24 * 60 * 60 * 1000; // Default 24 hours
    this.priorityLevels = config.priorityLevels || 10;
    this.contextWindowSize = config.contextWindowSize || 20;
    this.autoSummarize = config.autoSummarize !== undefined ? config.autoSummarize : true;
    this.summarizationThreshold = config.summarizationThreshold || 50;
    this.conversationThreads = new Map<string, MemoryEntry[]>();
    this.accessCounts = new Map<string, number>();
  }
  
  /**
   * Store a memory entry in short-term memory
   * 
   * @param entry The memory entry to store
   * @param threadId Optional thread identifier for conversation tracking
   */
  store(entry: MemoryEntry, threadId?: string): void {
    // Ensure entry has required fields
    if (!entry.timestamp) {
      entry.timestamp = new Date().toISOString();
    }
    
    if (!entry.id) {
      entry.id = `stm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Set default priority if not specified
    if (entry.priority === undefined) {
      entry.priority = 5; // Medium priority
    }
    
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
    
    // Store in conversation thread if threadId is provided
    if (threadId) {
      if (!this.conversationThreads.has(threadId)) {
        this.conversationThreads.set(threadId, []);
      }
      
      const thread = this.conversationThreads.get(threadId)!;
      thread.push(entry);
      
      // Check if summarization is needed
      if (this.autoSummarize && thread.length >= this.summarizationThreshold) {
        this.summarizeThread(threadId);
      }
    }
    
    // Prune old entries if needed
    this.pruneEntries();
  }
  
  /**
   * Retrieve entries from short-term memory based on query
   * 
   * @param query The search query
   * @param options Optional retrieval options
   * @returns Array of matching memory entries
   */
  async retrieve(query: string, options: {
    threadId?: string;
    minPriority?: number;
    limit?: number;
    contextOnly?: boolean;
  } = {}): Promise<MemoryEntry[]> {
    const now = new Date().getTime();
    const {
      threadId,
      minPriority = 0,
      limit = 50,
      contextOnly = false
    } = options;
    
    // Track accesses to boost frequently accessed entries
    const trackAccess = (entryId: string) => {
      if (!entryId) return;
      const currentCount = this.accessCounts.get(entryId) || 0;
      this.accessCounts.set(entryId, currentCount + 1);
      
      // Boost priority if accessed frequently
      if (currentCount > 5) {
        const entry = this.entries.find(e => e.id === entryId);
        if (entry && entry.priority !== undefined && entry.priority < this.priorityLevels) {
          entry.priority += 1;
        }
      }
    };
    
    // If threadId is provided, search only in that thread
    if (threadId && this.conversationThreads.has(threadId)) {
      const thread = this.conversationThreads.get(threadId)!;
      
      // If contextOnly is true, return just the most recent entries
      if (contextOnly) {
        const contextEntries = thread.slice(-this.contextWindowSize);
        contextEntries.forEach(entry => entry.id && trackAccess(entry.id));
        return contextEntries;
      }
      
      // Otherwise, search within the thread
      const results = thread.filter(entry => {
        // Check priority
        if ((entry.priority || 0) < minPriority) return false;
        
        // Check if entry is within retention period
        const entryTime = new Date(entry.timestamp).getTime();
        const isWithinRetention = (now - entryTime) <= this.retentionPeriod;
        if (!isWithinRetention) return false;
        
        // Check for query match
        let contentString = this.entryToString(entry);
        return contentString.toLowerCase().includes(query.toLowerCase());
      });
      
      // Track access for found entries
      results.forEach(entry => entry.id && trackAccess(entry.id));
      
      return results.slice(0, limit);
    }
    
    // Regular search across all entries
    const results = this.entries.filter(entry => {
      // Check priority
      if ((entry.priority || 0) < minPriority) return false;
      
      // Check if entry is within retention period
      const entryTime = new Date(entry.timestamp).getTime();
      const isWithinRetention = (now - entryTime) <= this.retentionPeriod;
      if (!isWithinRetention) return false;
      
      // If query is empty, match all entries within retention
      if (!query) return true;
      
      // Check if entry matches query
      let contentString = this.entryToString(entry);
      return contentString.toLowerCase().includes(query.toLowerCase());
    });
    
    // Sort by priority (higher first) and then by timestamp (newer first)
    results.sort((a, b) => {
      if ((b.priority || 0) !== (a.priority || 0)) {
        return (b.priority || 0) - (a.priority || 0);
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Track access for found entries
    results.slice(0, limit).forEach(entry => entry.id && trackAccess(entry.id));
    
    return results.slice(0, limit);
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
    this.conversationThreads.clear();
    this.accessCounts.clear();
    // Also clear Agno memory
    // Note: Agno Memory doesn't have a clear method currently,
    // this will need to be revisited when available
  }
  
  /**
   * Save memory state to JSON string
   * 
   * @returns JSON representation of memory state
   */
  serialize(): string {
    const state = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      entries: this.entries,
      // Converting Maps to arrays for ES5 compatibility
      threads: Array.from(this.conversationThreads.entries()),
      accessCounts: Array.from(this.accessCounts.entries()),
      config: {
        maxSize: this.maxSize,
        retentionPeriod: this.retentionPeriod,
        priorityLevels: this.priorityLevels,
        contextWindowSize: this.contextWindowSize,
        autoSummarize: this.autoSummarize,
        summarizationThreshold: this.summarizationThreshold
      }
    };
    
    return JSON.stringify(state);
  }
  
  /**
   * Load memory state from JSON string
   * 
   * @param json JSON representation of memory state
   * @returns True if successfully loaded, false if invalid format
   */
  deserialize(json: string): boolean {
    try {
      const state = JSON.parse(json);
      
      // Validate state structure
      if (!state.version || !state.entries || !Array.isArray(state.entries)) {
        console.error('Invalid memory state format');
        return false;
      }
      
      // Load state
      this.entries = state.entries;
      
      // Load threads if present
      if (state.threads && Array.isArray(state.threads)) {
        this.conversationThreads = new Map(state.threads);
      }
      
      // Load access counts if present
      if (state.accessCounts && Array.isArray(state.accessCounts)) {
        this.accessCounts = new Map(state.accessCounts);
      }
      
      // Load config if present
      if (state.config) {
        this.maxSize = state.config.maxSize || this.maxSize;
        this.retentionPeriod = state.config.retentionPeriod || this.retentionPeriod;
        this.priorityLevels = state.config.priorityLevels || this.priorityLevels;
        this.contextWindowSize = state.config.contextWindowSize || this.contextWindowSize;
        this.autoSummarize = state.config.autoSummarize !== undefined ? 
          state.config.autoSummarize : this.autoSummarize;
        this.summarizationThreshold = state.config.summarizationThreshold || 
          this.summarizationThreshold;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to deserialize memory state:', error);
      return false;
    }
  }
  /**
   * Get conversation thread entries
   * 
   * @param threadId The conversation thread ID
   * @param limit Maximum number of entries to return (latest first)
   * @returns Array of thread entries or empty array if thread doesn't exist
   */
  getThread(threadId: string, limit?: number): MemoryEntry[] {
    const thread = this.conversationThreads.get(threadId);
    if (!thread) return [];
    
    if (limit && limit < thread.length) {
      return thread.slice(-limit); // Get the most recent entries
    }
    
    return [...thread];
  }
  
  /**
   * List all conversation threads
   * 
   * @returns Array of thread IDs
   */
  getThreads(): string[] {
    return Array.from(this.conversationThreads.keys());
  }
  
  /**
   * Assign priority to a memory entry
   * 
   * @param entryId ID of the entry to update
   * @param priority New priority level (1-10)
   * @returns True if entry was updated, false if not found
   */
  setPriority(entryId: string, priority: number): boolean {
    const entry = this.entries.find(e => e.id === entryId);
    if (!entry) return false;
    
    // Clamp priority to valid range
    const clampedPriority = Math.max(1, Math.min(this.priorityLevels, priority));
    entry.priority = clampedPriority;
    return true;
  }
  
  /**
   * Summarize a conversation thread to reduce memory usage
   * 
   * @param threadId ID of the thread to summarize
   */
  private async summarizeThread(threadId: string): Promise<void> {
    const thread = this.conversationThreads.get(threadId);
    if (!thread || thread.length < this.summarizationThreshold) return;
    
    // In a real implementation, we would use an LLM to generate a summary
    // For now, we'll just create a placeholder summary and keep the most recent entries
    
    // Keep the most recent entries (context window size)
    const recentEntries = thread.slice(-this.contextWindowSize);
    
    // Create a summary entry of the older content
    const oldEntries = thread.slice(0, thread.length - this.contextWindowSize);
    if (oldEntries.length === 0) return;
    
    // Create summary text (in a real implementation, this would be generated by an LLM)
    const summaryContent = `Conversation summary: ${oldEntries.length} messages exchanged between ${new Date(oldEntries[0].timestamp).toISOString()} and ${new Date(oldEntries[oldEntries.length - 1].timestamp).toISOString()}`;
    
    // Create a summary entry
    const summaryEntry: MemoryEntry = {
      id: `summary_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      content: summaryContent,
      timestamp: new Date().toISOString(),
      priority: 7, // Higher priority for summaries
      metadata: {
        type: 'summary',
        summarizedEntries: oldEntries.length,
        threadId
      }
    };
    
    // Replace the thread with the summary followed by recent entries
    this.conversationThreads.set(threadId, [summaryEntry, ...recentEntries]);
    
    // Also add the summary to the main entries list
    this.entries.push(summaryEntry);
  }
  
  /**
   * Convert a memory entry to searchable string
   * 
   * @param entry The memory entry to convert
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
    
    // Add metadata if present - ES5 compatible approach
    if (entry.metadata) {
      const metadataPairs = [];
      for (const key in entry.metadata) {
        if (Object.prototype.hasOwnProperty.call(entry.metadata, key)) {
          metadataPairs.push(key + ': ' + entry.metadata[key]);
        }
      }
      result += ' ' + metadataPairs.join(' ');
    }
    
    return result;
  }
  
  /**
   * Remove old entries based on retention period and max size
   */
  private pruneEntries(): void {
    const now = new Date().getTime();
    
    // Remove entries older than retention period
    this.entries = this.entries.filter(entry => {
      // Don't prune summary entries
      if (entry.metadata?.type === 'summary') return true;
      
      const entryTime = new Date(entry.timestamp).getTime();
      return (now - entryTime) <= this.retentionPeriod;
    });
    
    // If still over max size, remove oldest entries (keeping high priority ones)
    if (this.entries.length > this.maxSize) {
      // Sort by priority (higher first) and then by timestamp (newer first)
      this.entries.sort((a, b) => {
        // Always keep summaries at the top
        if (a.metadata?.type === 'summary' && b.metadata?.type !== 'summary') return -1;
        if (a.metadata?.type !== 'summary' && b.metadata?.type === 'summary') return 1;
        
        if ((b.priority || 0) !== (a.priority || 0)) {
          return (b.priority || 0) - (a.priority || 0);
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      
      // Keep only the top maxSize entries
      this.entries = this.entries.slice(0, this.maxSize);
    }
    
    // Also prune conversation threads
    for (const [threadId, thread] of this.conversationThreads.entries()) {
      // If thread is too long, consider summarizing
      if (this.autoSummarize && thread.length > this.summarizationThreshold) {
        this.summarizeThread(threadId);
      }
    }
  }
  
  /**
   * Save memory state to browser's localStorage
   * 
   * @param key localStorage key to use
   * @returns True if successfully saved, false if failed
   */
  saveToLocalStorage(key: string = 'agent_nexus_short_term_memory'): boolean {
    if (typeof window === 'undefined') {
      return false; // Not in browser environment
    }
    
    try {
      const serialized = this.serialize();
      window.localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save memory to localStorage:', error);
      return false;
    }
  }
  
  /**
   * Load memory state from browser's localStorage
   * 
   * @param key localStorage key to use
   * @returns True if successfully loaded, false if failed
   */
  loadFromLocalStorage(key: string = 'agent_nexus_short_term_memory'): boolean {
    if (typeof window === 'undefined') {
      return false; // Not in browser environment
    }
    
    try {
      const serialized = window.localStorage.getItem(key);
      if (!serialized) {
        return false;
      }
      
      return this.deserialize(serialized);
    } catch (error) {
      console.error('Failed to load memory from localStorage:', error);
      return false;
    }
  }
  
  /**
   * Get memory statistics
   * 
   * @returns Statistics about the memory system
   */
  getStats(): Record<string, any> {
    const now = new Date().getTime();
    
    // Count entries by age buckets
    const ageStats = {
      last1Hour: 0,
      last24Hours: 0,
      lastWeek: 0,
      older: 0
    };
    
    // Count entries by priority
    const priorityStats: Record<number, number> = {};
    
    // Process each entry
    for (const entry of this.entries) {
      // Age stats
      const entryTime = new Date(entry.timestamp).getTime();
      const ageMs = now - entryTime;
      
      if (ageMs < 60 * 60 * 1000) { // < 1 hour
        ageStats.last1Hour++;
      } else if (ageMs < 24 * 60 * 60 * 1000) { // < 24 hours
        ageStats.last24Hours++;
      } else if (ageMs < 7 * 24 * 60 * 60 * 1000) { // < 1 week
        ageStats.lastWeek++;
      } else {
        ageStats.older++;
      }
      
      // Priority stats
      const priority = entry.priority || 0;
      priorityStats[priority] = (priorityStats[priority] || 0) + 1;
    }
    
    return {
      totalEntries: this.entries.length,
      threadCount: this.conversationThreads.size,
      maxSize: this.maxSize,
      retentionPeriodDays: this.retentionPeriod / (24 * 60 * 60 * 1000),
      ageDistribution: ageStats,
      priorityDistribution: priorityStats,
      summaryCount: this.entries.filter(e => e.metadata?.type === 'summary').length
    };
  }
}
