/**
 * API route for interacting with the Agent Nexus
 */

import { NextRequest, NextResponse } from 'next/server';
import { AgentNexus } from '@/core/agent';
import { modelManager } from '@/core/models/factory';

// Shared across API routes - IMPORTANT to use the same instance
export let agentInstance: AgentNexus | null = null;

function getAgent(provider?: string, model?: string) {
  try {
    if (!agentInstance) {
      // If no specific provider is requested, use the default from model manager
      // This should be properly set based on DEFAULT_MODEL_PROVIDER env var
      const defaultProvider = provider || modelManager.listProviders().find(p => p !== 'demo') || 'demo';
      
      if (!defaultProvider) {
        throw new Error('No model providers available. Please configure at least one provider.');
      }
      
      console.log(`Creating new agent with provider: ${defaultProvider}, model: ${model || 'default'}`);
      
      agentInstance = new AgentNexus({
        modelProvider: defaultProvider,
        modelName: model,
        agentName: "Agent Nexus",
        description: "An advanced cognitive agent architecture with human-like reasoning capabilities"
      });
    } else if (provider) {
      // If a specific provider is requested and we already have an agent,
      // switch the existing agent to the requested provider
      console.log(`Switching agent to provider: ${provider}, model: ${model || 'default'}`);
      agentInstance.switchModelProvider(provider, model);
    }
    
    return agentInstance;
  } catch (error) {
    // If there's an error getting or switching the agent, log it and fallback to demo
    console.error('Error in getAgent:', error);
    
    // If we don't have an instance at all, create one with demo provider
    if (!agentInstance) {
      console.log('Falling back to demo provider');
      agentInstance = new AgentNexus({
        modelProvider: 'demo',
        agentName: "Agent Nexus (Demo)",
        description: "Demo agent with no API keys configured"
      });
    }
    
    return agentInstance;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, type = 'chat', provider, model } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    console.log(`Processing ${type} request with provider: ${provider}, model: ${model}`);
    console.log(`Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
    
    try {
      // Get or initialize the agent with the specified provider and model
      const agent = getAgent(provider, model);
      
      let response;
      
      if (type === 'chat') {
        response = await agent.chat(message);
      } else if (type === 'task') {
        response = await agent.processTask(message);
      } else {
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
      }
      
      return NextResponse.json({ response });
    } catch (error) {
      // This catch block handles errors from the agent or model
      console.error('Agent/model error:', error);
      return NextResponse.json(
        { error: `Model error: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
        { status: 500 }
      );
    }
  } catch (error) {
    // This catch block handles errors from processing the request itself
    console.error('Request processing error:', error);
    return NextResponse.json(
      { error: `Request error: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}
