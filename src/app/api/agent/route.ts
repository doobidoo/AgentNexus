/**
 * API route for interacting with the Agent Nexus
 */

import { NextRequest, NextResponse } from 'next/server';
import { AgentNexus } from '@/core/agent';
import { modelManager } from '@/core/models/factory';

// Agent singleton (in a real application, you'd manage this differently)
let agentInstance: AgentNexus | null = null;

function getAgent(provider?: string, model?: string) {
  if (!agentInstance) {
    // If no specific provider is requested, use the first available one
    const defaultProvider = provider || modelManager.listProviders()[0];
    
    if (!defaultProvider) {
      throw new Error('No model providers available. Please configure at least one provider.');
    }
    
    agentInstance = new AgentNexus({
      modelProvider: defaultProvider,
      modelName: model,
      agentName: "Agent Nexus",
      description: "An advanced cognitive agent architecture with human-like reasoning capabilities"
    });
  } else if (provider) {
    // If a specific provider is requested and we already have an agent,
    // switch the existing agent to the requested provider
    agentInstance.switchModelProvider(provider, model);
  }
  
  return agentInstance;
}

export async function POST(request: NextRequest) {
  try {
    const { message, type = 'chat', provider, model } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
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
    console.error('Agent error:', error);
    return NextResponse.json(
      { error: `An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` }, 
      { status: 500 }
    );
  }
}
