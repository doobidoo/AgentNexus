/**
 * Agent Nexus Test Suite
 * 
 * Tests for the core agent functionality
 */

import { AgentNexus } from '../src/core/agent';
import { ModelMessage } from '../src/core/models/base';

// Mock the model provider
const mockModelProvider = {
  generateCompletion: jest.fn(),
  generateEmbeddings: jest.fn(),
  getInfo: jest.fn(),
};

// Set up mock implementations
mockModelProvider.getInfo.mockReturnValue({
  name: 'Mock Provider',
  version: '1.0.0',
  defaultCompletionModel: 'mock-model',
  defaultEmbeddingModel: 'mock-embeddings',
  capabilities: {
    streaming: false,
    functionCalling: false,
    vision: false,
    embeddings: true
  },
  maxTokens: 1000
});

// Mock for success case
const setupSuccessMock = () => {
  mockModelProvider.generateCompletion.mockResolvedValue(
    "This is a mock response from the agent."
  );
};

// Mock for failure case
const setupFailureMock = () => {
  mockModelProvider.generateCompletion.mockRejectedValue(
    new Error("Mock API error")
  );
};

describe('AgentNexus', () => {
  let agent: AgentNexus;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a new agent with mock provider
    agent = new AgentNexus({
      modelProvider: mockModelProvider,
      modelName: 'mock-model',
      agentName: 'Test Agent',
      description: 'Test Agent Description'
    });
  });
  
  describe('chat', () => {
    it('should call the model provider with correct messages', async () => {
      // Set up mock
      setupSuccessMock();
      
      // Call chat
      const message = "Hello, agent!";
      await agent.chat(message);
      
      // Check that model provider was called correctly
      expect(mockModelProvider.generateCompletion).toHaveBeenCalledTimes(1);
      
      // Get the messages passed to generateCompletion
      const callArgs = mockModelProvider.generateCompletion.mock.calls[0];
      const messages: ModelMessage[] = callArgs[0];
      
      // Check that the system message is present
      expect(messages[0].role).toBe('system');
      
      // Check that the user message is present with correct content
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toBe(message);
    });
    
    it('should return the model response', async () => {
      // Set up mock
      setupSuccessMock();
      
      // Call chat
      const response = await agent.chat("Hello, agent!");
      
      // Check response
      expect(response).toBe("This is a mock response from the agent.");
    });
    
    it('should handle model provider errors gracefully', async () => {
      // Set up error mock
      setupFailureMock();
      
      // Call chat and expect it to throw
      await expect(agent.chat("Hello, agent!"))
        .rejects
        .toThrow("Failed to generate a response: Mock API error");
    });
  });
  
  describe('processTask', () => {
    it('should create and execute a plan', async () => {
      // Set up mock
      setupSuccessMock();
      
      // Create spy on planning and action methods
      const createPlanSpy = jest.spyOn(agent['planning'], 'createPlan');
      const executePlanSpy = jest.spyOn(agent['action'], 'executePlan');
      
      createPlanSpy.mockResolvedValue({
        goal: 'Test goal',
        steps: ['Step 1', 'Step 2']
      });
      
      executePlanSpy.mockResolvedValue('Task completed successfully');
      
      // Call processTask
      const result = await agent.processTask("Complex task");
      
      // Check that planning and action methods were called
      expect(createPlanSpy).toHaveBeenCalledWith("Complex task");
      expect(executePlanSpy).toHaveBeenCalled();
      
      // Check result
      expect(result).toBe('Task completed successfully');
    });
  });
  
  describe('modelInfo', () => {
    it('should return correct model information', () => {
      const info = agent.getModelInfo();
      
      expect(info).toEqual({
        provider: 'Mock Provider',
        model: 'mock-model',
        agentName: 'Test Agent'
      });
    });
  });
  
  describe('switchModelProvider', () => {
    it('should update the model provider', () => {
      // Mock the modelManager.getProvider method
      const mockGetProvider = jest.fn().mockReturnValue({
        ...mockModelProvider,
        getInfo: jest.fn().mockReturnValue({
          name: 'New Provider',
          version: '2.0.0',
          defaultCompletionModel: 'new-model',
          defaultEmbeddingModel: 'new-embeddings',
          capabilities: {
            streaming: true,
            functionCalling: true,
            vision: true,
            embeddings: true
          },
          maxTokens: 2000
        })
      });
      
      // Replace the real modelManager.getProvider with our mock
      const originalGetProvider = require('../src/core/models/factory').modelManager.getProvider;
      require('../src/core/models/factory').modelManager.getProvider = mockGetProvider;
      
      // Switch provider
      agent.switchModelProvider('newProvider');
      
      // Check that getProvider was called
      expect(mockGetProvider).toHaveBeenCalledWith('newProvider');
      
      // Check that model info was updated
      const info = agent.getModelInfo();
      expect(info.provider).toBe('New Provider');
      
      // Restore original method
      require('../src/core/models/factory').modelManager.getProvider = originalGetProvider;
    });
  });
});