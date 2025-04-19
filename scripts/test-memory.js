/**
 * Memory System Test Script
 * 
 * This script tests the memory system's integration with the MCP-MEMORY-Service.
 * It creates and retrieves memories from both short-term and long-term storage.
 */

// We need to use require for this script to run directly with Node.js
const { MemorySystem } = require('../dist/core/memory'); // Assuming you have compiled TypeScript

async function runTest() {
  console.log('=== Memory System Integration Test ===');
  
  // Create memory system with Chroma integration
  const memory = new MemorySystem({
    useChroma: true,
    chromaConfig: {
      serviceUrl: 'http://localhost:8000', // Update this to your MCP-MEMORY-Service URL
      collectionName: 'agent_nexus_test'
    }
  });
  
  console.log('Memory system initialized with Chroma integration');
  
  // Test storing entries
  console.log('\nStoring test entries...');
  
  try {
    // Store in short-term only
    await memory.store({
      content: 'Short-term test entry',
      metadata: { source: 'test', type: 'short-term' }
    }, 'short');
    console.log('✅ Stored entry in short-term memory');
    
    // Store in long-term only
    await memory.store({
      content: 'Long-term test entry',
      metadata: { source: 'test', type: 'long-term' }
    }, 'long');
    console.log('✅ Stored entry in long-term memory');
    
    // Store in both
    await memory.store({
      content: 'Test entry for both memory systems',
      metadata: { source: 'test', type: 'both' }
    }, 'both');
    console.log('✅ Stored entry in both memory systems');
    
    // Give a small delay to ensure all operations complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Retrieve all entries
    const allEntries = await memory.getAllEntries();
    console.log('\nRetrieved all entries:');
    console.log(`- Short-term entries: ${allEntries.shortTerm.length}`);
    console.log(`- Long-term entries: ${allEntries.longTerm.length}`);
    
    // Test semantic search
    console.log('\nTesting semantic search...');
    const searchResults = await memory.retrieve('test entry');
    console.log(`Found ${searchResults.length} results for "test entry"`);
    
    if (searchResults.length > 0) {
      console.log('\nTop search result:');
      console.log(JSON.stringify(searchResults[0], null, 2));
    }
    
    console.log('\n=== Memory System Integration Test Complete ===');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
runTest();
