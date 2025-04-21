import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { 
  ToolSelector,
  SelectionStrategy,
  ToolSelectionOptions,
  ToolSelectionResult
} from '../../src/core/tools/tool-selection';
import { BaseTool, ToolInput, ToolOutput } from '../../src/core/tools/base';
import { ToolMetadata } from '../../src/core/tools';

// Mock tool implementation for testing
class MockTool implements BaseTool {
  name: string;
  description: string;
  capabilities: string[];
  version: string;
  
  constructor(name: string, description: string, capabilities: string[]) {
    this.name = name;
    this.description = description;
    this.capabilities = capabilities;
    this.version = '1.0.0';
  }
  
  async execute(_input: ToolInput): Promise<ToolOutput> {
    return {
      success: true,
      result: `Executed ${this.name}`,
      timestamp: new Date().toISOString(),
      requestId: 'test-request'
    };
  }
}

describe('ToolSelector', () => {
  let toolSelector: ToolSelector;
  let availableTools: Record<string, BaseTool>;
  let toolMetadata: Record<string, ToolMetadata>;
  
  beforeEach(() => {
    // Initialize the ToolSelector with small cache TTL for testing
    toolSelector = new ToolSelector(1000, 10);
    
    // Create test tools
    availableTools = {
      'textSearch': new MockTool(
        'textSearch',
        'Search for text in documents',
        ['search', 'text processing', 'information retrieval']
      ),
      'imageAnalysis': new MockTool(
        'imageAnalysis',
        'Analyze images for objects and scenes',
        ['image processing', 'object detection', 'visual analysis']
      ),
      'dataTransformation': new MockTool(
        'dataTransformation',
        'Transform data between different formats',
        ['data processing', 'format conversion', 'transformation']
      ),
      'webBrowser': new MockTool(
        'webBrowser',
        'Browse websites and extract information',
        ['web', 'browsing', 'information retrieval']
      )
    };
    
    // Create corresponding metadata
    toolMetadata = {
      'textSearch': {
        name: 'textSearch',
        description: 'Search for text in documents',
        capabilities: ['search', 'text processing', 'information retrieval'],
        version: '1.0.0',
        useCount: 10,
        lastUsed: new Date(Date.now() - 3600000), // 1 hour ago
        averageExecutionTime: 150,
        tags: ['search', 'text']
      },
      'imageAnalysis': {
        name: 'imageAnalysis',
        description: 'Analyze images for objects and scenes',
        capabilities: ['image processing', 'object detection', 'visual analysis'],
        version: '1.0.0',
        useCount: 5,
        lastUsed: new Date(Date.now() - 7200000), // 2 hours ago
        averageExecutionTime: 300,
        tags: ['images', 'vision']
      },
      'dataTransformation': {
        name: 'dataTransformation',
        description: 'Transform data between different formats',
        capabilities: ['data processing', 'format conversion', 'transformation'],
        version: '1.0.0',
        useCount: 15,
        lastUsed: new Date(Date.now() - 1800000), // 30 minutes ago
        averageExecutionTime: 100,
        tags: ['data', 'transformation']
      },
      'webBrowser': {
        name: 'webBrowser',
        description: 'Browse websites and extract information',
        capabilities: ['web', 'browsing', 'information retrieval'],
        version: '1.0.0',
        useCount: 20,
        lastUsed: new Date(Date.now() - 900000), // 15 minutes ago
        averageExecutionTime: 500,
        tags: ['web', 'browsing']
      }
    };
  });
  
  test('should select tools based on keyword matching', () => {
    const taskDescription = 'I need to search for text in my documents';
    const result = toolSelector.selectTools(
      taskDescription,
      availableTools,
      toolMetadata,
      { strategy: SelectionStrategy.KEYWORD_MATCH }
    );
    
    // textSearch should have the highest score
    expect(result.selectedTools[0]).toBe('textSearch');
    expect(result.scores['textSearch']).toBeGreaterThan(0.5);
    
    // Strategy should be KEYWORD_MATCH
    expect(result.strategy).toBe(SelectionStrategy.KEYWORD_MATCH);
  });
  
  test('should select tools based on capability matching', () => {
    const taskDescription = 'I need help with some image processing';
    const result = toolSelector.selectTools(
      taskDescription,
      availableTools,
      toolMetadata,
      { strategy: SelectionStrategy.CAPABILITY_MATCH }
    );
    
    // imageAnalysis should have the highest score
    expect(result.selectedTools[0]).toBe('imageAnalysis');
    expect(result.scores['imageAnalysis']).toBeGreaterThan(0.3);
    
    // Strategy should be CAPABILITY_MATCH
    expect(result.strategy).toBe(SelectionStrategy.CAPABILITY_MATCH);
  });
  
  test('should select tools based on historical performance', () => {
    const taskDescription = 'help me with a task';
    const result = toolSelector.selectTools(
      taskDescription,
      availableTools,
      toolMetadata,
      { strategy: SelectionStrategy.HISTORICAL }
    );
    
    // Should prioritize tools with higher usage, more recent use, and faster execution
    // webBrowser has the highest usage and most recent use
    expect(result.selectedTools).toContain('webBrowser');
    
    // Strategy should be HISTORICAL
    expect(result.strategy).toBe(SelectionStrategy.HISTORICAL);
  });
  
  test('should select tools using hybrid approach', () => {
    const taskDescription = 'I need to transform some data from CSV to JSON';
    const result = toolSelector.selectTools(
      taskDescription,
      availableTools,
      toolMetadata,
      { strategy: SelectionStrategy.HYBRID }
    );
    
    // dataTransformation should be selected due to keyword and capability matches
    expect(result.selectedTools).toContain('dataTransformation');
    
    // Strategy should be HYBRID
    expect(result.strategy).toBe(SelectionStrategy.HYBRID);
  });
  
  test('should select tools adaptively based on context', () => {
    const taskDescription = 'I need to browse a website';
    const context = {
      previousToolSuccess: {
        'webBrowser': true,
        'textSearch': false
      }
    };
    
    const result = toolSelector.selectTools(
      taskDescription,
      availableTools,
      toolMetadata,
      { 
        strategy: SelectionStrategy.ADAPTIVE,
        context 
      }
    );
    
    // webBrowser should be selected with a boost due to previous success
    expect(result.selectedTools[0]).toBe('webBrowser');
    
    // Strategy should be ADAPTIVE
    expect(result.strategy).toBe(SelectionStrategy.ADAPTIVE);
  });
  
  test('should limit the number of selected tools', () => {
    const taskDescription = 'I need to work with some data';
    const result = toolSelector.selectTools(
      taskDescription,
      availableTools,
      toolMetadata,
      { maxTools: 2 }
    );
    
    // Should only return at most 2 tools
    expect(result.selectedTools.length).toBeLessThanOrEqual(2);
  });
  
  test('should filter tools by minimum score', () => {
    const taskDescription = 'I need help with something';
    const result = toolSelector.selectTools(
      taskDescription,
      availableTools,
      toolMetadata,
      { minScore: 0.5 }
    );
    
    // All returned tools should have scores >= 0.5
    Object.values(result.scores).forEach(score => {
      expect(score).toBeGreaterThanOrEqual(0.5);
    });
  });
  
  test('should cache selection results', () => {
    // Spy on the selectByKeywords method
    const selectByKeywordsSpy = jest.spyOn(
      toolSelector as any, 
      'selectByKeywords'
    );
    
    const taskDescription = 'I need to search for specific information';
    
    // First call should not use cache
    toolSelector.selectTools(
      taskDescription,
      availableTools,
      toolMetadata,
      { strategy: SelectionStrategy.KEYWORD_MATCH }
    );
    
    expect(selectByKeywordsSpy).toHaveBeenCalledTimes(1);
    selectByKeywordsSpy.mockClear();
    
    // Second call with same task should use cache
    const cachedResult = toolSelector.selectTools(
      taskDescription,
      availableTools,
      toolMetadata,
      { strategy: SelectionStrategy.KEYWORD_MATCH }
    );
    
    // selectByKeywords should not be called again
    expect(selectByKeywordsSpy).not.toHaveBeenCalled();
    
    // Result should indicate it came from cache
    expect(cachedResult.metadata.fromCache).toBe(true);
  });
  
  test('should invalidate cache when available tools change', () => {
    const taskDescription = 'I need to search for something';
    
    // First call to cache result
    toolSelector.selectTools(
      taskDescription,
      availableTools,
      toolMetadata
    );
    
    // Create a modified set of tools
    const modifiedTools = { ...availableTools };
    delete modifiedTools['textSearch'];
    
    // Second call with different tools should not use cache
    const result = toolSelector.selectTools(
      taskDescription,
      modifiedTools,
      toolMetadata
    );
    
    // Result should not come from cache
    expect(result.metadata.fromCache).toBeUndefined();
  });
  
  test('should clear cache when requested', () => {
    const taskDescription = 'I need to search for something';
    
    // Cache a result
    toolSelector.selectTools(
      taskDescription,
      availableTools,
      toolMetadata
    );
    
    // Clear the cache
    toolSelector.clearCache();
    
    // Spy on the selectByKeywords method
    const selectByKeywordsSpy = jest.spyOn(
      toolSelector as any, 
      'selectByKeywords'
    );
    
    // Call again with the same task
    toolSelector.selectTools(
      taskDescription,
      availableTools,
      toolMetadata
    );
    
    // Should have executed the selection again
    expect(selectByKeywordsSpy).toHaveBeenCalled();
  });
  
  test('should expose cache statistics', () => {
    // Cache some results
    toolSelector.selectTools(
      'task one',
      availableTools,
      toolMetadata
    );
    
    toolSelector.selectTools(
      'task two',
      availableTools,
      toolMetadata
    );
    
    const stats = toolSelector.getCacheStats();
    
    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBe(10);
    expect(stats.ttl).toBe(1000);
    expect(stats.oldestEntry).toBeLessThanOrEqual(Date.now());
    expect(stats.newestEntry).toBeLessThanOrEqual(Date.now());
  });
});
