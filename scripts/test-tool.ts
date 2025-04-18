/**
 * Tool Testing Script
 * 
 * A utility script to test individual tools in the Agent Nexus framework
 */

import * as dotenv from 'dotenv';
import { VectorSearch } from '../src/core/tools/vector-search';
import { TextGeneration } from '../src/core/tools/text-generation';
import { CodeExecutor } from '../src/core/tools/code-executor';
import { WebBrowser } from '../src/core/tools/web-browser';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Available tools
const TOOLS = {
  'vectorSearch': VectorSearch,
  'textGeneration': TextGeneration,
  'codeExecutor': CodeExecutor,
  'webBrowser': WebBrowser,
  // Add more tools as they are implemented
};

// Parse command line arguments
const toolName = process.argv[2];
const paramsJson = process.argv[3] || '{}';

if (!toolName) {
  console.error('Error: Tool name is required');
  console.log('Usage: npm run test-tool -- <toolName> [paramsJson]');
  console.log('Available tools:');
  Object.keys(TOOLS).forEach(name => {
    console.log(`  - ${name}`);
  });
  console.log('\nExample commands:');
  console.log('- npm run test-tool -- vectorSearch \'{"query":"example search"}\'');
  console.log('- npm run test-tool -- textGeneration \'{"prompt":"Summarize the benefits of AI","temperature":0.7}\'');
  console.log('- npm run test-tool -- codeExecutor \'{"code":"console.log(\'Hello, world!\');","language":"javascript"}\'');
  console.log('- npm run test-tool -- webBrowser \'{"url":"https://example.com","operation":"get"}\'');
  process.exit(1);
}

if (!TOOLS[toolName]) {
  console.error(`Error: Tool "${toolName}" not found`);
  console.log('Available tools:');
  Object.keys(TOOLS).forEach(name => {
    console.log(`  - ${name}`);
  });
  process.exit(1);
}

let params;
try {
  params = JSON.parse(paramsJson);
} catch (error) {
  console.error('Error parsing parameters JSON:', error);
  process.exit(1);
}

/**
 * Test a specific tool with provided parameters
 */
async function testTool(toolName: string, params: any) {
  console.log(`=== Testing ${toolName} Tool ===`);
  console.log('Parameters:', JSON.stringify(params, null, 2));
  
  try {
    // Instantiate the tool
    const ToolClass = TOOLS[toolName];
    const tool = new ToolClass();
    
    console.log('\nTool info:');
    console.log(`Name: ${tool.name}`);
    console.log(`Description: ${tool.description}`);
    console.log(`Capabilities: ${tool.capabilities.join(', ')}`);
    console.log(`Version: ${tool.version}`);
    
    // Prepare the input
    const input = {
      params,
      timestamp: new Date().toISOString(),
      requestId: `test_${Date.now()}`
    };
    
    // Validate the input
    if (tool.validate) {
      const isValid = tool.validate(input);
      console.log(`\nInput validation: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
      
      if (!isValid) {
        console.error('Exiting due to invalid input');
        process.exit(1);
      }
    }
    
    // Execute the tool
    console.log('\nExecuting tool...');
    const startTime = Date.now();
    
    const result = await tool.execute(input);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Execution completed in ${duration}ms`);
    console.log('\nResult:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✅ Tool execution successful');
    } else {
      console.log('\n❌ Tool execution failed');
    }
  } catch (error) {
    console.error('\n❌ Error testing tool:', error);
  }
}

// Run the test
testTool(toolName, params).catch(console.error);

// Example usage:
// npm run test-tool -- vectorSearch '{"query":"example search"}'
// npm run test-tool -- textGeneration '{"prompt":"Summarize the benefits of AI","temperature":0.7}'
// npm run test-tool -- codeExecutor '{"code":"console.log(\"Hello, world!\");","language":"javascript"}'
// npm run test-tool -- webBrowser '{"url":"https://example.com","operation":"get"}'
