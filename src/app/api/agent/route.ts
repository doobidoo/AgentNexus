/**
 * Agent Nexus API Endpoint
 * 
 * This API route integrates with the Agent Nexus architecture and
 * allows communication with the agent through a REST interface.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AgentNexus } from '@/core/agent';

// Initialize the agent (in a production app, you'd manage this differently)
let agentInstance: AgentNexus | null = null;

function getAgent() {
  if (!agentInstance) {
    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    agentInstance = new AgentNexus({
      apiKey,
      name: "Agent Nexus",
      description: "An advanced cognitive agent architecture with human-like reasoning capabilities"
    });
  }
  
  return agentInstance;
}

export async function POST(request: NextRequest) {
  try {
    const { message, type = 'chat' } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    // Get or initialize the agent
    const agent = getAgent();
    
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
