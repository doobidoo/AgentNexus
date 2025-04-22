/**
 * Advanced Tool Selection System for Agent Nexus
 * 
 * Provides sophisticated algorithms for selecting the most appropriate tools
 * based on task requirements, tool capabilities, and historical performance.
 */

import { BaseTool } from './base';
import { ToolMetadata } from './index';

/**
 * Selection strategy types for tool selection
 */
export enum SelectionStrategy {
  KEYWORD_MATCH = 'keyword_match',     // Select based on keyword matching
  CAPABILITY_MATCH = 'capability_match', // Select based on capability matching
  HYBRID = 'hybrid',                   // Combination of keyword and capability matching
  HISTORICAL = 'historical',           // Select based on historical performance
  ADAPTIVE = 'adaptive'                // Adapt selection based on context and feedback
}

/**
 * Tool selection algorithm result
 */
export interface ToolSelectionResult {
  // Selected tool IDs in order of relevance
  selectedTools: string[];
  // Scores for each selected tool (0-1)
  scores: Record<string, number>;
  // Reasons for selection
  reasons: Record<string, string>;
  // Strategy used for selection
  strategy: SelectionStrategy;
  // Selection metadata
  metadata: {
    // Execution time in milliseconds
    executionTimeMs: number;
    // Number of tools evaluated
    toolsEvaluated: number;
    // Query context used
    queryContext?: string;
    // Whether the result was from cache
    fromCache?: boolean;
  };
}

/**
 * Cached selection result for performance optimization
 */
interface CachedSelection {
  // Selection result
  result: ToolSelectionResult;
  // Task description hash
  taskHash: string;
  // Timestamp when cached
  timestamp: number;
  // Tools available when cached
  availableTools: Set<string>;
}

/**
 * Tool selection options
 */
export interface ToolSelectionOptions {
  // Selection strategy to use
  strategy?: SelectionStrategy;
  // Minimum score threshold (0-1) for inclusion
  minScore?: number;
  // Maximum number of tools to select
  maxTools?: number;
  // Whether to use cached results when available
  useCache?: boolean;
  // Additional context for selection
  context?: Record<string, any>;
}

/**
 * The ToolSelector provides advanced algorithms for selecting the most
 * appropriate tools based on task requirements and tool capabilities.
 */
export class ToolSelector {
  // Tool selection cache for performance optimization
  private selectionCache: Map<string, CachedSelection> = new Map();
  // Cache TTL in milliseconds (default: 5 minutes)
  private cacheTTL: number = 5 * 60 * 1000;
  // Maximum cache size
  private maxCacheSize: number = 100;
  
  /**
   * Create a new ToolSelector
   * 
   * @param cacheTTL Optional cache TTL in milliseconds
   * @param maxCacheSize Optional maximum cache size
   */
  constructor(cacheTTL?: number, maxCacheSize?: number) {
    if (cacheTTL !== undefined) {
      this.cacheTTL = cacheTTL;
    }
    
    if (maxCacheSize !== undefined) {
      this.maxCacheSize = maxCacheSize;
    }
  }
  
  /**
   * Select tools that are suitable for a task
   * 
   * @param taskDescription Description of the task
   * @param availableTools Available tools with metadata
   * @param options Tool selection options
   * @returns Selection result with scores and reasons
   */
  selectTools(
    taskDescription: string,
    availableTools: Record<string, BaseTool>,
    toolMetadata: Record<string, ToolMetadata>,
    options: ToolSelectionOptions = {}
  ): ToolSelectionResult {
    const startTime = performance.now();
    
    // Default options
    const strategy = options.strategy || SelectionStrategy.HYBRID;
    const minScore = options.minScore !== undefined ? options.minScore : 0.1;
    const maxTools = options.maxTools || 5;
    const useCache = options.useCache !== false;
    
    // Try to get from cache if enabled
    if (useCache) {
      const cacheKey = this.generateCacheKey(taskDescription, strategy);
      const cachedResult = this.selectionCache.get(cacheKey);
      
      if (cachedResult && this.isCacheValid(cachedResult, availableTools)) {
        // Add cache hit metadata
        return {
          ...cachedResult.result,
          metadata: {
            ...cachedResult.result.metadata,
            fromCache: true
          }
        };
      }
    }
    
    // Select tools based on the chosen strategy
    let scores: Record<string, number> = {};
    let reasons: Record<string, string> = {};
    
    switch (strategy) {
      case SelectionStrategy.KEYWORD_MATCH:
        ({ scores, reasons } = this.selectByKeywords(taskDescription, availableTools, toolMetadata));
        break;
      case SelectionStrategy.CAPABILITY_MATCH:
        ({ scores, reasons } = this.selectByCapabilities(taskDescription, availableTools, toolMetadata));
        break;
      case SelectionStrategy.HISTORICAL:
        ({ scores, reasons } = this.selectByHistoricalPerformance(taskDescription, availableTools, toolMetadata, options.context));
        break;
      case SelectionStrategy.ADAPTIVE:
        ({ scores, reasons } = this.selectAdaptively(taskDescription, availableTools, toolMetadata, options.context));
        break;
      case SelectionStrategy.HYBRID:
      default:
        ({ scores, reasons } = this.selectHybrid(taskDescription, availableTools, toolMetadata, options.context));
        break;
    }
    
    // Filter tools by minimum score and sort by score
    const selectedTools = Object.entries(scores)
      .filter(([_, score]) => score >= minScore)
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxTools)
      .map(([toolId]) => toolId);
    
    // Filter scores and reasons to include only selected tools
    const filteredScores: Record<string, number> = {};
    const filteredReasons: Record<string, string> = {};
    
    for (const toolId of selectedTools) {
      filteredScores[toolId] = scores[toolId];
      filteredReasons[toolId] = reasons[toolId];
    }
    
    // Create result
    const result: ToolSelectionResult = {
      selectedTools,
      scores: filteredScores,
      reasons: filteredReasons,
      strategy,
      metadata: {
        executionTimeMs: performance.now() - startTime,
        toolsEvaluated: Object.keys(availableTools).length,
        queryContext: options.context ? JSON.stringify(options.context).slice(0, 100) : undefined
      }
    };
    
    // Cache result if caching is enabled
    if (useCache) {
      const cacheKey = this.generateCacheKey(taskDescription, strategy);
      
      // Manage cache size
      if (this.selectionCache.size >= this.maxCacheSize) {
        this.pruneCache();
      }
      
      this.selectionCache.set(cacheKey, {
        result,
        taskHash: cacheKey,
        timestamp: Date.now(),
        availableTools: new Set(Object.keys(availableTools))
      });
    }
    
    return result;
  }
  
  /**
   * Select tools based on keyword matching
   * 
   * @param taskDescription Description of the task
   * @param availableTools Available tools
   * @param toolMetadata Tool metadata
   * @returns Scores and reasons for selection
   */
  private selectByKeywords(
    taskDescription: string,
    availableTools: Record<string, BaseTool>,
    toolMetadata: Record<string, ToolMetadata>
  ): { scores: Record<string, number>; reasons: Record<string, string> } {
    const scores: Record<string, number> = {};
    const reasons: Record<string, string> = {};
    const taskLower = taskDescription.toLowerCase();
    
    // Extract keywords from task description (words longer than 3 characters)
    const taskKeywords = taskLower
      .split(/\W+/)
      .filter(word => word.length > 3);
    
    for (const [toolId, tool] of Object.entries(availableTools)) {
      const metadata = toolMetadata[toolId];
      
      if (!metadata) continue;
      
      let score = 0;
      const matchedKeywords: string[] = [];
      
      // Match tool name
      const nameParts = toolId.toLowerCase().split(/[._-]/);
      for (const part of nameParts) {
        if (taskLower.includes(part) && part.length > 2) {
          score += 0.3;
          matchedKeywords.push(`tool name (${part})`);
        }
      }
      
      // Match description keywords
      const descKeywords = metadata.description
        .toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 3);
      
      for (const keyword of descKeywords) {
        if (taskLower.includes(keyword)) {
          score += 0.2;
          matchedKeywords.push(`description keyword (${keyword})`);
        }
      }
      
      // Match tags
      if (metadata.tags) {
        for (const tag of metadata.tags) {
          if (taskLower.includes(tag.toLowerCase())) {
            score += 0.25;
            matchedKeywords.push(`tag (${tag})`);
          }
        }
      }
      
      // Calculate final score normalized to 0-1
      // Cap at 1.0 maximum
      scores[toolId] = Math.min(1.0, score);
      
      // Generate reason based on matches
      if (matchedKeywords.length > 0) {
        reasons[toolId] = `Matched based on ${matchedKeywords.join(', ')}`;
      } else {
        reasons[toolId] = 'No keyword matches found';
      }
    }
    
    return { scores, reasons };
  }
  
  /**
   * Select tools based on capability matching
   * 
   * @param taskDescription Description of the task
   * @param availableTools Available tools
   * @param toolMetadata Tool metadata
   * @returns Scores and reasons for selection
   */
  private selectByCapabilities(
    taskDescription: string,
    availableTools: Record<string, BaseTool>,
    toolMetadata: Record<string, ToolMetadata>
  ): { scores: Record<string, number>; reasons: Record<string, string> } {
    const scores: Record<string, number> = {};
    const reasons: Record<string, string> = {};
    const taskLower = taskDescription.toLowerCase();
    
    for (const [toolId, tool] of Object.entries(availableTools)) {
      const metadata = toolMetadata[toolId];
      
      if (!metadata) continue;
      
      let score = 0;
      const matchedCapabilities: string[] = [];
      
      // Match capabilities
      if (metadata.capabilities) {
        for (const capability of metadata.capabilities) {
          const capabilityLower = capability.toLowerCase();
          
          if (taskLower.includes(capabilityLower)) {
            score += 0.4;
            matchedCapabilities.push(capability);
          }
          
          // Check for semantic similarity
          // This is a simplified approach - in a real system, you might use embeddings
          // to check for semantic similarity
          const capabilityWords = capabilityLower.split(/\W+/).filter(word => word.length > 3);
          for (const word of capabilityWords) {
            if (taskLower.includes(word)) {
              score += 0.1;
              if (!matchedCapabilities.includes(capability)) {
                matchedCapabilities.push(capability);
              }
            }
          }
        }
      }
      
      // Calculate final score normalized to 0-1
      // Cap at 1.0 maximum
      scores[toolId] = Math.min(1.0, score);
      
      // Generate reason based on matches
      if (matchedCapabilities.length > 0) {
        reasons[toolId] = `Matched capabilities: ${matchedCapabilities.join(', ')}`;
      } else {
        reasons[toolId] = 'No capability matches found';
      }
    }
    
    return { scores, reasons };
  }
  
  /**
   * Select tools based on historical performance
   * 
   * @param taskDescription Description of the task
   * @param availableTools Available tools
   * @param toolMetadata Tool metadata
   * @param context Additional context for selection
   * @returns Scores and reasons for selection
   */
  private selectByHistoricalPerformance(
    taskDescription: string,
    availableTools: Record<string, BaseTool>,
    toolMetadata: Record<string, ToolMetadata>,
    context?: Record<string, any>
  ): { scores: Record<string, number>; reasons: Record<string, string> } {
    const scores: Record<string, number> = {};
    const reasons: Record<string, string> = {};
    
    for (const [toolId, tool] of Object.entries(availableTools)) {
      const metadata = toolMetadata[toolId];
      
      if (!metadata) continue;
      
      let score = 0;
      let reason = '';
      
      // Base score from usage count (normalized to 0-0.3)
      // More usage suggests more usefulness
      if (metadata.useCount !== undefined) {
        const usageScore = Math.min(0.3, metadata.useCount / 100);
        score += usageScore;
        reason += `Usage history (${metadata.useCount} uses), `;
      }
      
      // Factor in average execution time (normalized to 0-0.2)
      // Faster execution gets higher score
      if (metadata.averageExecutionTime !== undefined) {
        // Normalize: 0ms = 0.2, 5000ms = 0
        const timeScore = Math.max(0, 0.2 - (metadata.averageExecutionTime / 25000));
        score += timeScore;
        reason += `Performance (avg: ${metadata.averageExecutionTime.toFixed(2)}ms), `;
      }
      
      // Factor in recency of usage (normalized to 0-0.2)
      // More recent usage gets higher score
      if (metadata.lastUsed) {
        const lastUsedTime = new Date(metadata.lastUsed).getTime();
        const now = Date.now();
        const hoursSinceLastUse = (now - lastUsedTime) / (1000 * 60 * 60);
        
        // Normalize: 0 hours = 0.2, 24 hours = 0
        const recencyScore = Math.max(0, 0.2 - (hoursSinceLastUse / 120));
        score += recencyScore;
        reason += `Recency (${hoursSinceLastUse.toFixed(1)} hours ago), `;
      }
      
      // Add a small baseline keyword match
      const keywordMatch = this.selectByKeywords(
        taskDescription, 
        { [toolId]: tool }, 
        { [toolId]: metadata }
      );
      
      score += keywordMatch.scores[toolId] * 0.3;
      reason += keywordMatch.reasons[toolId];
      
      // Calculate final score normalized to 0-1
      // Cap at 1.0 maximum
      scores[toolId] = Math.min(1.0, score);
      
      // Clean up reason string
      reasons[toolId] = reason.replace(/, $/, '');
    }
    
    return { scores, reasons };
  }
  
  /**
   * Select tools using a hybrid approach combining multiple strategies
   * 
   * @param taskDescription Description of the task
   * @param availableTools Available tools
   * @param toolMetadata Tool metadata
   * @param context Additional context for selection
   * @returns Scores and reasons for selection
   */
  private selectHybrid(
    taskDescription: string,
    availableTools: Record<string, BaseTool>,
    toolMetadata: Record<string, ToolMetadata>,
    context?: Record<string, any>
  ): { scores: Record<string, number>; reasons: Record<string, string> } {
    // Get scores from individual strategies
    const keywordResults = this.selectByKeywords(taskDescription, availableTools, toolMetadata);
    const capabilityResults = this.selectByCapabilities(taskDescription, availableTools, toolMetadata);
    const historicalResults = this.selectByHistoricalPerformance(taskDescription, availableTools, toolMetadata, context);
    
    const scores: Record<string, number> = {};
    const reasons: Record<string, string> = {};
    
    // Weight for each strategy
    const keywordWeight = 0.3;
    const capabilityWeight = 0.5;
    const historicalWeight = 0.2;
    
    for (const toolId of Object.keys(availableTools)) {
      // Calculate weighted score
      scores[toolId] = (
        (keywordResults.scores[toolId] || 0) * keywordWeight +
        (capabilityResults.scores[toolId] || 0) * capabilityWeight +
        (historicalResults.scores[toolId] || 0) * historicalWeight
      );
      
      // Combine reasons
      const keywordReason = keywordResults.reasons[toolId] || 'No keyword matches';
      const capabilityReason = capabilityResults.reasons[toolId] || 'No capability matches';
      const historicalReason = historicalResults.reasons[toolId] || 'No historical data';
      
      reasons[toolId] = `Hybrid selection: [Keywords: ${keywordReason}] [Capabilities: ${capabilityReason}] [Historical: ${historicalReason}]`;
    }
    
    return { scores, reasons };
  }
  
  /**
   * Select tools adaptively based on context and feedback
   * 
   * @param taskDescription Description of the task
   * @param availableTools Available tools
   * @param toolMetadata Tool metadata
   * @param context Additional context for selection
   * @returns Scores and reasons for selection
   */
  private selectAdaptively(
    taskDescription: string,
    availableTools: Record<string, BaseTool>,
    toolMetadata: Record<string, ToolMetadata>,
    context?: Record<string, any>
  ): { scores: Record<string, number>; reasons: Record<string, string> } {
    // Start with hybrid selection as a base
    const { scores: baseScores, reasons: baseReasons } = this.selectHybrid(
      taskDescription, availableTools, toolMetadata, context
    );
    
    const scores: Record<string, number> = { ...baseScores };
    const reasons: Record<string, string> = { ...baseReasons };
    
    // Adaptive adjustments based on context
    if (context) {
      // Adjust based on previous tool success
      if (context.previousToolSuccess) {
        for (const [toolId, success] of Object.entries(context.previousToolSuccess as Record<string, boolean>)) {
          if (scores[toolId] !== undefined) {
            const adjustment = success ? 0.1 : -0.15;
            scores[toolId] = Math.max(0, Math.min(1, scores[toolId] + adjustment));
            reasons[toolId] += ` [Adjusted ${adjustment > 0 ? 'up' : 'down'} based on previous ${success ? 'success' : 'failure'}]`;
          }
        }
      }
      
      // Adjust based on related tasks
      if (context.relatedTasks && context.relatedTaskTools) {
        const relatedTasks = context.relatedTasks as string[];
        const relatedTaskTools = context.relatedTaskTools as Record<string, string[]>;
        
        for (const relatedTask of relatedTasks) {
          const toolsForRelatedTask = relatedTaskTools[relatedTask];
          
          if (toolsForRelatedTask) {
            for (const toolId of toolsForRelatedTask) {
              if (scores[toolId] !== undefined) {
                scores[toolId] = Math.min(1, scores[toolId] + 0.05);
                reasons[toolId] += ` [Boosted for related task: ${relatedTask}]`;
              }
            }
          }
        }
      }
      
      // Adjust for task complexity
      if (context.taskComplexity) {
        const complexity = context.taskComplexity as number; // 0-1 scale
        
        for (const toolId of Object.keys(scores)) {
          const metadata = toolMetadata[toolId];
          
          // Advanced tools get higher scores for complex tasks
          if (metadata && metadata.additionalMetadata && metadata.additionalMetadata.complexity) {
            const toolComplexity = metadata.additionalMetadata.complexity as number; // 0-1 scale
            const match = 1 - Math.abs(complexity - toolComplexity);
            
            scores[toolId] = Math.min(1, scores[toolId] + match * 0.1);
            reasons[toolId] += ` [Complexity match: ${match.toFixed(2)}]`;
          }
        }
      }
    }
    
    return { scores, reasons };
  }
  
  /**
   * Generate a cache key for a task and strategy
   * 
   * @param taskDescription Task description
   * @param strategy Selection strategy
   * @returns Cache key
   */
  private generateCacheKey(taskDescription: string, strategy: SelectionStrategy): string {
    // Simple hash function for the task description
    let hash = 0;
    
    for (let i = 0; i < taskDescription.length; i++) {
      const char = taskDescription.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0; // Convert to 32bit integer
    }
    
    return `${strategy}_${hash}`;
  }
  
  /**
   * Check if a cached selection is still valid
   * 
   * @param cachedSelection Cached selection
   * @param availableTools Currently available tools
   * @returns Whether the cache is valid
   */
  private isCacheValid(
    cachedSelection: CachedSelection,
    availableTools: Record<string, BaseTool>
  ): boolean {
    // Check if cache has expired
    if (Date.now() - cachedSelection.timestamp > this.cacheTTL) {
      return false;
    }
    
    // Check if available tools have changed
    const currentTools = new Set(Object.keys(availableTools));
    
    // If the sets are different sizes, they can't be equal
    if (currentTools.size !== cachedSelection.availableTools.size) {
      return false;
    }
    
    // Check if all tools are still available
    for (const tool of cachedSelection.availableTools) {
      if (!currentTools.has(tool)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Prune the cache to remove expired or least recently used entries
   */
  private pruneCache(): void {
    const now = Date.now();
    
    // Remove expired entries
    for (const [key, value] of this.selectionCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.selectionCache.delete(key);
      }
    }
    
    // If still too large, remove oldest entries
    if (this.selectionCache.size >= this.maxCacheSize) {
      const entries = Array.from(this.selectionCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      // Remove oldest entries to get back to 75% of max size
      const toRemove = this.selectionCache.size - Math.floor(this.maxCacheSize * 0.75);
      
      for (let i = 0; i < toRemove; i++) {
        this.selectionCache.delete(entries[i][0]);
      }
    }
  }
  
  /**
   * Configure the cache settings
   * 
   * @param ttl Cache TTL in milliseconds
   * @param maxSize Maximum cache size
   */
  configureCache(ttl: number, maxSize: number): void {
    this.cacheTTL = ttl;
    this.maxCacheSize = maxSize;
  }
  
  /**
   * Clear the selection cache
   */
  clearCache(): void {
    this.selectionCache.clear();
  }
  
  /**
   * Get statistics about the selection cache
   * 
   * @returns Cache statistics
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    ttl: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    
    for (const entry of this.selectionCache.values()) {
      oldestTimestamp = Math.min(oldestTimestamp, entry.timestamp);
      newestTimestamp = Math.max(newestTimestamp, entry.timestamp);
    }
    
    return {
      size: this.selectionCache.size,
      maxSize: this.maxCacheSize,
      ttl: this.cacheTTL,
      oldestEntry: oldestTimestamp,
      newestEntry: newestTimestamp
    };
  }
}