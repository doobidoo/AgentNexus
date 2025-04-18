/**
 * Run First Task
 * 
 * A simple script to test Agent Nexus with a sample task.
 * This is useful for testing the agent before integrating with task-master.
 */

import { AgentNexus } from '../src/core/agent';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runFirstTask() {
  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is required');
    process.exit(1);
  }

  console.log('Initializing Agent Nexus...');
  
  // Initialize the agent
  const agent = new AgentNexus({
    apiKey,
    name: "Agent Nexus",
    description: "An advanced cognitive agent architecture with human-like reasoning abilities"
  });

  // Define a sample task
  const task = `
    Design a simple REST API for a task management system with the following requirements:
    
    1. Users should be able to create, read, update, and delete tasks
    2. Tasks should have a title, description, due date, status, and priority
    3. Users should be able to filter tasks by status and priority
    4. The API should use JSON for request and response bodies
    
    Please provide:
    - API endpoint definitions
    - Data models
    - Example request and response for each endpoint
  `;

  console.log('Processing task...');
  console.log('Task: ' + task.trim());
  console.log('-'.repeat(80));

  try {
    // Process the task
    const result = await agent.processTask(task);
    
    // Display the result
    console.log('Task result:');
    console.log('='.repeat(80));
    console.log(result);
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error processing task:', error);
  }
}

// Run the main function
runFirstTask().catch(console.error);
