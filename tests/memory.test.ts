/**
 * Memory System Tests
 * 
 * Tests for the Agent Nexus memory system components
 */

import { MemorySystem } from '../src/core/memory';
import { createMockMemoryEntry } from './utils';

/**
 * Simple test runner
 */
async function runTests() {
  console.log('=== Memory System Tests ===');
  
  // Test initialization
  console.log('\nTest: Memory system initialization');
  try {
    const memory = new MemorySystem();
    console.log('✅ Memory system initialized successfully');
  } catch (error) {
    console.error('❌ Memory system initialization failed:', error);
  }
  
  // Test storing an entry
  console.log('\nTest: Storing a memory entry');
  try {
    const memory = new MemorySystem();
    const entry = createMockMemoryEntry({ content: 'Test storing an entry' });
    memory.store(entry);
    console.log('✅ Memory entry stored successfully');
  } catch (error) {
    console.error('❌ Memory entry storage failed:', error);
  }
  
  // Test retrieving an entry
  console.log('\nTest: Retrieving a memory entry');
  try {
    const memory = new MemorySystem();
    const entry = createMockMemoryEntry({ content: 'This is a unique test entry for retrieval' });
    memory.store(entry);
    
    const results = await memory.retrieve('unique test entry');
    if (results.length > 0) {
      console.log(`✅ Retrieved ${results.length} entries successfully`);
    } else {
      console.error('❌ No entries retrieved');
    }
  } catch (error) {
    console.error('❌ Memory retrieval failed:', error);
  }
  
  // Test short-term memory storage and retrieval
  console.log('\nTest: Short-term memory specific storage');
  try {
    const memory = new MemorySystem();
    const entry = createMockMemoryEntry({ content: 'Short-term only test entry' });
    memory.store(entry, 'short');
    
    const shortResults = await memory.retrieve('Short-term only', 'short');
    const longResults = await memory.retrieve('Short-term only', 'long');
    
    if (shortResults.length > 0 && longResults.length === 0) {
      console.log('✅ Entry correctly stored only in short-term memory');
    } else {
      console.error(`❌ Unexpected results: ${shortResults.length} short-term, ${longResults.length} long-term`);
    }
  } catch (error) {
    console.error('❌ Short-term memory test failed:', error);
  }
  
  // Test long-term memory storage and retrieval
  console.log('\nTest: Long-term memory specific storage');
  try {
    const memory = new MemorySystem();
    const entry = createMockMemoryEntry({ content: 'Long-term only test entry' });
    memory.store(entry, 'long');
    
    const shortResults = await memory.retrieve('Long-term only', 'short');
    const longResults = await memory.retrieve('Long-term only', 'long');
    
    if (shortResults.length === 0 && longResults.length > 0) {
      console.log('✅ Entry correctly stored only in long-term memory');
    } else {
      console.error(`❌ Unexpected results: ${shortResults.length} short-term, ${longResults.length} long-term`);
    }
  } catch (error) {
    console.error('❌ Long-term memory test failed:', error);
  }
  
  // Test string content normalization
  console.log('\nTest: String content normalization');
  try {
    const memory = new MemorySystem();
    memory.store('Simple string content');
    
    const results = await memory.retrieve('Simple string');
    if (results.length > 0) {
      console.log('✅ String content correctly normalized and stored');
    } else {
      console.error('❌ String normalization failed');
    }
  } catch (error) {
    console.error('❌ String normalization test failed:', error);
  }
  
  console.log('\n=== Memory System Tests Complete ===');
}

// Run tests
runTests().catch(console.error);
