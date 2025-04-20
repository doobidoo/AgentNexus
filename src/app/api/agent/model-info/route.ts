/**
 * API route for getting the current model information
 */

import { NextRequest, NextResponse } from 'next/server';
import { AgentNexus } from '@/core/agent';
import { modelManager } from '@/core/models/factory';

// Agent singleton (in a real application, you'd manage this differently)
let agentInstance: AgentNexus | null = null;

function getAgent() {
  if (!agentInstance) {
    const firstProvider = modelManager.listProviders()[0];
    
    if (!firstProvider) {
      throw new Error('No model providers available. Please configure at least one provider.');
    }
    
    agentInstance = new AgentNexus({
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
