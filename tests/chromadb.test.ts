/**
 * ChromaDB Integration Test for Agent Nexus
 * 
 * This test file checks the integration between the memory system and ChromaDB.
 */

import { MemorySystem } from '../src/core/memory';
import { ChromaClient } from '../src/core/memory/chromadb-client';

// Create a test with ChromaDB enabled
async function testChromaDBIntegration() {
  console.log('Starting ChromaDB integration test...');
  
  // Create memory system with ChromaDB enabled
  const memory = new MemorySystem({
    useChroma: true,
    chromaConfig: {
      serviceUrl: 'http://localhost:8000',
      collectionName: 'agent_nexus_test'
    }
  });
  
  // Store some test data
  console.log('Storing test data in memory...');
  await memory.store({ 
    content: 'This is a test entry for ChromaDB integration',
    metadata: {
      source: 'test',
      tags: ['test', 'chromadb', 'integration']
    }
  });
  
  // Store another entry
  await memory.store({
    content: 'Here is another test entry with different content',
    metadata: {
      source: 'test',
      tags: ['test', 'different']
    }
  });
  
  // Retrieve data using similarity search
  console.log('Retrieving data using similarity search...');
  const results = await memory.retrieve('test chromadb');
  
  // Display results
  console.log(`Found ${results.length} results:`);
  results.forEach((entry, index) => {
    console.log(`Result ${index + 1}:`);
    console.log(`Content: ${typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content)}`);
    console.log(`Metadata: ${JSON.stringify(entry.metadata)}`);
    console.log('---');
  });
  
  // Test cleanup
  console.log('Cleaning up test data...');
  await memory.longTerm.clear();
  
  console.log('ChromaDB integration test completed.');
}

// Only run if this file is executed directly (not imported)
if (require.main === module) {
  // Run the test
  testChromaDBIntegration()
    .then(() => console.log('Test completed successfully'))
    .catch(err => console.error('Test failed:', err))
    .finally(() => process.exit());
}
