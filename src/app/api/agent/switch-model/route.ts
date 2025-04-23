/**
 * API route for switching the model provider
 */

import { NextRequest, NextResponse } from 'next/server';
import { AgentNexus } from '@/core/agent';
import { modelManager } from '@/core/models/factory';
import { agentInstance } from '../route'; // Import the shared agent instance

function getAgent() {
  if (!agentInstance) {
    // Get default provider from model manager - prefer real providers over demo
    const defaultProvider = modelManager.listProviders().find(p => p !== 'demo') || modelManager.listProviders()[0];
    
    if (!defaultProvider) {
      throw new Error('No model providers available. Please configure at least one provider.');
    }
    
    return new AgentNexus({
      modelProvider: defaultProvider,
      agentName: "Agent Nexus",
      description: "An advanced cognitive agent architecture with human-like reasoning capabilities"
    });
  }
  
  return agentInstance;
}

export async function POST(request: NextRequest) {
  try {
    const { provider, model } = await request.json();
    
    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }
    
    // Check if the provider exists
    if (!modelManager.listProviders().includes(provider)) {
      return NextResponse.json(
        { error: `Provider "${provider}" not found` },
        { status: 404 }
      );
    }
    
    // Get or initialize the agent
    const agent = getAgent();
    
    // Switch to the new model provider
    agent.switchModelProvider(provider, model);
    
    // Get updated model info
    const modelInfo = agent.getModelInfo();
    
    return NextResponse.json(modelInfo);
  } catch (error) {
    console.error('Error switching model:', error);
    return NextResponse.json(
      { error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
