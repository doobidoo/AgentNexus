/**
 * API route for getting the current model information
 */

import { NextRequest, NextResponse } from 'next/server';
import { AgentNexus } from '@/core/agent';
import { modelManager } from '@/core/models/factory';
import { agentInstance } from '../route'; // Import the shared agent instance

function getAgent() {
  if (!agentInstance) {
    // Get default provider from model manager - prefer real providers over demo
    const firstProvider = modelManager.listProviders().find(p => p !== 'demo') || modelManager.listProviders()[0];
    
    if (!firstProvider) {
      throw new Error('No model providers available. Please configure at least one provider.');
    }
    
    return new AgentNexus({
      modelProvider: firstProvider,
      agentName: "Agent Nexus",
      description: "An advanced cognitive agent architecture with human-like reasoning capabilities"
    });
  }
  
  return agentInstance;
}

export async function GET(_request: NextRequest) {
  try {
    // Get or initialize the agent
    const agent = getAgent();
    
    // Get model info
    const modelInfo = agent.getModelInfo();
    
    return NextResponse.json(modelInfo);
  } catch (error) {
    console.error('Error getting model info:', error);
    return NextResponse.json(
      { error: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
