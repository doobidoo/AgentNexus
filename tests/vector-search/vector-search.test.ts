/**
 * VectorSearch Tool Tests
 * 
 * These tests validate the functionality of the VectorSearch tool,
 * including connection handling, document operations, and search functionality.
 */

import { VectorSearch } from '../../src/core/tools/vector-search';
import { ToolInput } from '../../src/core/tools/base';

// Mock Weaviate client
jest.mock('weaviate-ts-client', () => {
  const mockClient = {
    schema: {
      getter: jest.fn().mockReturnValue({
        do: jest.fn().mockResolvedValue({ classes: [] })
      }),
      classCreator: jest.fn().mockReturnValue({
        withClass: jest.fn().mockReturnThis(),
        do: jest.fn().mockResolvedValue({})
      })
    },
    graphql: {
      get: jest.fn().mockReturnValue({
        withClassName: jest.fn().mockReturnThis(),
        withNearText: jest.fn().mockReturnThis(),
        withLimit: jest.fn().mockReturnThis(),
        withFields: jest.fn().mockReturnThis(),
        withWhere: jest.fn().mockReturnThis(),
        do: jest.fn().mockResolvedValue({
          data: {
            Documents: [
              {
                content: 'Test Document 1',
                metadata: { source: 'test' },
                _additional: {
                  id: 'test-id-1',
                  certainty: 0.95
                }
              },
              {
                content: 'Test Document 2',
                metadata: { source: 'test' },
                _additional: {
                  id: 'test-id-2',
                  certainty: 0.85
                }
              }
            ]
          }
        })
      })
    },
    batch: {
      objectsBatcher: jest.fn().mockReturnValue({
        withObject: jest.fn().mockReturnThis(),
        do: jest.fn().mockResolvedValue({})
      })
    },
    misc: {
      metaGetter: jest.fn().mockReturnValue({
        do: jest.fn().mockResolvedValue({ version: 'v1.0.0' })
      })
    }
  };

  return {
    client: jest.fn().mockReturnValue(mockClient),
    ApiKey: jest.fn().mockImplementation((key) => ({ value: key }))
  };
});

// Enable environment variables mock
jest.mock('process', () => ({
  ...jest.requireActual('process'),
  env: {
    WEAVIATE_HOST: 'test-host:8080',
    WEAVIATE_SCHEME: 'http',
    WEAVIATE_API_KEY: 'test-api-key'
  }
}));

describe('VectorSearch Tool', () => {
  let vectorSearch: VectorSearch;

  beforeEach(() => {
    jest.clearAllMocks();
    vectorSearch = new VectorSearch();
  });

  describe('Constructor & Initialization', () => {
    test('should initialize with environment variables', () => {
      expect(vectorSearch).toBeDefined();
      expect(vectorSearch.getConnectionStatus()).toBe('connecting');
    });
  });

  describe('Connection Management', () => {
    test('should check connection status on initialization', async () => {
      await new Promise(process.nextTick); // Let async connection check complete
      expect(vectorSearch.getConnectionStatus()).toBe('connected');
    });
  });

  describe('Search Functionality', () => {
    test('should validate search parameters', () => {
      const invalidInput: ToolInput = {
        tool: 'vectorSearch',
        params: {}
      };
      
      const validInput: ToolInput = {
        tool: 'vectorSearch',
        params: {
          query: 'test query'
        }
      };

      // @ts-ignore - Private method access for testing
      expect(vectorSearch.validate(invalidInput)).toBe(false);
      // @ts-ignore - Private method access for testing
      expect(vectorSearch.validate(validInput)).toBe(true);
    });

    test('should execute search with valid parameters', async () => {
      const input: ToolInput = {
        tool: 'vectorSearch',
        params: {
          query: 'test query',
          collection: 'Documents',
          topK: 5,
          similarityThreshold: 0.7
        }
      };

      const result = await vectorSearch.execute(input);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].score).toBeGreaterThan(0.9);
    });
  });

  describe('Document Management', () => {
    test('should initialize collection if it does not exist', async () => {
      await vectorSearch.initializeCollection('TestCollection');
      // Ensure schema getter was called
      const weaviateClient = require('weaviate-ts-client').client();
      expect(weaviateClient.schema.getter).toHaveBeenCalled();
      expect(weaviateClient.schema.classCreator).toHaveBeenCalled();
    });

    test('should add documents to collection', async () => {
      const documents = [
        { content: 'Test document 1', metadata: { source: 'test' } },
        { content: 'Test document 2', metadata: { source: 'test' } }
      ];

      await vectorSearch.addDocuments(documents, 'TestCollection');
      const weaviateClient = require('weaviate-ts-client').client();
      expect(weaviateClient.batch.objectsBatcher).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle connection failures', async () => {
      // Mock connection failure
      const weaviateClient = require('weaviate-ts-client').client();
      weaviateClient.misc.metaGetter().do.mockRejectedValueOnce(new Error('Connection failed'));
      
      // Create a new instance to trigger connection failure
      const failingSearch = new VectorSearch();
      await new Promise(process.nextTick); // Let async connection check complete
      
      expect(failingSearch.getConnectionStatus()).toBe('disconnected');
    });

    test('should handle search failures with retry logic', async () => {
      // Mock a temporary failure then success
      const weaviateClient = require('weaviate-ts-client').client();
      const mockDo = weaviateClient.graphql.get().do;
      
      // Fail the first attempt, succeed on the second
      mockDo
        .mockRejectedValueOnce(new Error('Temporary search failure'))
        .mockResolvedValueOnce({
          data: {
            Documents: [{ 
              content: 'Retry success', 
              metadata: {}, 
              _additional: { id: 'test-id', certainty: 0.9 } 
            }]
          }
        });
      
      const input: ToolInput = {
        tool: 'vectorSearch',
        params: { query: 'test query' }
      };

      const result = await vectorSearch.execute(input);
      expect(result.success).toBe(true);
      expect(mockDo).toHaveBeenCalledTimes(2);
    });
  });
});
