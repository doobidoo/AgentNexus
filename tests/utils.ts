/**
 * Test Utilities for Agent Nexus
 * 
 * Helper functions and utilities for testing Agent Nexus components
 */

import { MemoryEntry } from '../src/core/memory';
import { ToolInput, ToolOutput } from '../src/core/tools/base';
import { SubgoalData } from '../src/core/planning/subgoal';
import { Thought } from '../src/core/planning/chain-of-thoughts';

/**
 * Create a mock memory entry for testing
 */
export function createMockMemoryEntry(
  overrides: Partial<MemoryEntry> = {}
): MemoryEntry {
  return {
    content: 'Test memory content',
    timestamp: new Date().toISOString(),
    priority: 5,
    id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    ...overrides
  };
}

/**
 * Create a mock tool input for testing
 */
export function createMockToolInput(
  overrides: Partial<ToolInput> = {}
): ToolInput {
  return {
    params: {},
    timestamp: new Date().toISOString(),
    requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
    ...overrides
  };
}

/**
 * Create a mock tool output for testing
 */
export function createMockToolOutput(
  success: boolean = true,
  overrides: Partial<ToolOutput> = {}
): ToolOutput {
  const requestId = overrides.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  if (success) {
    return {
      success: true,
      result: 'Test result',
      timestamp: new Date().toISOString(),
      requestId,
      ...overrides
    };
  } else {
    return {
      success: false,
      error: 'Test error',
      timestamp: new Date().toISOString(),
      requestId,
      ...overrides
    };
  }
}

/**
 * Create a mock subgoal for testing
 */
export function createMockSubgoal(
  overrides: Partial<SubgoalData> = {}
): SubgoalData {
  const id = overrides.id || `goal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  
  return {
    id,
    description: 'Test subgoal description',
    priority: 5,
    estimatedComplexity: 3,
    dependencies: [],
    ...overrides
  };
}

/**
 * Create a mock thought for testing
 */
export function createMockThought(
  overrides: Partial<Thought> = {}
): Thought {
  const id = overrides.id || `thought_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  const subgoalId = overrides.subgoalId || `goal_${Date.now()}`;
  
  return {
    id,
    content: 'Test thought content',
    subgoalId,
    dependencies: [],
    confidence: 0.8,
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

/**
 * Mock an async function response for testing
 */
export async function mockAsyncResponse<T>(value: T, delay: number = 100): Promise<T> {
  return new Promise(resolve => {
    setTimeout(() => resolve(value), delay);
  });
}

/**
 * Create a test logger for debugging
 */
export function createTestLogger(prefix: string = 'TEST') {
  return {
    log: (message: string, ...args: any[]) => 
      console.log(`[${prefix}] ${message}`, ...args),
    
    error: (message: string, ...args: any[]) => 
      console.error(`[${prefix}] ERROR: ${message}`, ...args),
    
    warn: (message: string, ...args: any[]) => 
      console.warn(`[${prefix}] WARNING: ${message}`, ...args),
    
    info: (message: string, ...args: any[]) => 
      console.info(`[${prefix}] INFO: ${message}`, ...args),
    
    debug: (message: string, ...args: any[]) => 
      console.debug(`[${prefix}] DEBUG: ${message}`, ...args),
  };
}
