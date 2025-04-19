/**
 * VectorSearch Integration Tests
 * 
 * These tests validate the VectorSearch tool with an actual Weaviate instance.
 * Note: These tests require a running Weaviate instance to pass.
 * 
 * To run these tests:
 * 1. Start Weaviate using docker-compose: docker-compose up -d weaviate
 * 2. Run: npm run test:integration
 */

import { VectorSearch } from '../../src/core/tools/vector-search';
import { ToolInput } from '../../src/core/tools/base';
import * as fs from 'fs';
import * as path from 'path';

// Import test fixtures
const sampleDocuments = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-documents.json'), 'utf-8')
);

// Skip tests if integration testing is not enabled
const runIntegrationTests = process.env.RUN_INTEGRATION_TESTS === 'true';
const testMethod = runIntegrationTests ? test : test.skip;

// Set a unique collection name for testing to avoid conflicts
const TEST_COLLECTION = `TestCollection_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

describe('VectorSearch Integration Tests', () => {
  let vectorSearch: VectorSearch;

  beforeAll(async () => {
    // Initialize VectorSearch
    vectorSearch = new VectorSearch();
    
    // Wait for connection to establish
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check connection status
    const status = vectorSearch.getConnectionStatus();
    if (status !== 'connected') {
      console.warn(`WARNING: Weaviate is not connected (status: ${status}). Integration tests will be skipped.`);
    }
    
    // Initialize collection and load test data
    if (status === 'connected') {
      try {
        // Create test collection
        await vectorSearch.initializeCollection(TEST_COLLECTION);
        
        // Add sample documents
        await vectorSearch.addDocuments(sampleDocuments, TEST_COLLECTION);
        console.log(`Added ${sampleDocuments.length} sample documents to ${TEST_COLLECTION}`);
      } catch (error) {
        console.error('Error setting up test data:', error);
      }
    }
  }, 10000); // Increase timeout for connection and setup

  // Test basic search functionality
  testMethod('should find relevant documents based on semantic query', async () => {
    const input: ToolInput = {
      tool: 'vectorSearch',
      params: {
        query: 'How does memory work in Agent Nexus?',
        collection: TEST_COLLECTION,
        topK: 3,
        similarityThreshold: 0.6
      }
    };

    const result = await vectorSearch.execute(input);
    expect(result.success).toBe(true);
    
    const data = result.data;
    expect(data).toBeInstanceOf(Array);
    expect(data.length).toBeGreaterThan(0);
    
    // The top result should be related to memory
    const containsMemoryInfo = data.some(
      item => item.content.toLowerCase().includes('memory')
    );
    expect(containsMemoryInfo).toBe(true);
  }, 5000);

  // Test filtering capability
  testMethod('should filter results by metadata', async () => {
    const input: ToolInput = {
      tool: 'vectorSearch',
      params: {
        query: 'What tools are available?',
        collection: TEST_COLLECTION,
        topK: 5,
        filters: {
          source: 'documentation',
          category: 'tools'
        }
      }
    };

    const result = await vectorSearch.execute(input);
    expect(result.success).toBe(true);
    
    // All results should be from the tools category
    const toolsResults = result.data.filter(
      item => item.metadata && item.metadata.category === 'tools'
    );
    
    expect(toolsResults.length).toBe(result.data.length);
  }, 5000);

  // Test handling of non-existent collection
  testMethod('should handle queries to non-existent collections', async () => {
    const input: ToolInput = {
      tool: 'vectorSearch',
      params: {
        query: 'test query',
        collection: 'NonExistentCollection'
      }
    };

    const result = await vectorSearch.execute(input);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  }, 5000);

  // Clean up test collection after tests
  afterAll(async () => {
    if (vectorSearch.getConnectionStatus() === 'connected') {
      try {
        // Note: In a real implementation, you might add a deleteCollection method
        // Since Weaviate JS client doesn't have a direct deleteClass method in the batch API,
        // we'd need custom cleanup logic here
        console.log(`Test complete. Test collection: ${TEST_COLLECTION}`);
      } catch (error) {
        console.error('Error cleaning up test collection:', error);
      }
    }
    
    await vectorSearch.shutdown();
  }, 5000);
});
