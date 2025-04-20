/**
 * Tool Testing Script
 * 
 * A utility script to test individual tools in the Agent Nexus framework
 * with support for configuration testing
 */

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { VectorSearch } from '../src/core/tools/vector-search';
import { TextGeneration } from '../src/core/tools/text-generation';
import { CodeExecutor } from '../src/core/tools/code-executor';
import { WebBrowser } from '../src/core/tools/web-browser';
import { ToolsManager } from '../src/core/tools';
import { configManager } from '../src/core/tools/config-manager';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize tools manager
const toolsManager = new ToolsManager();

// Define the type for our tools registry
type ToolRegistry = {
  [key: string]: typeof VectorSearch | typeof TextGeneration | typeof CodeExecutor | typeof WebBrowser;
};

// Available tool classes
const TOOLS: ToolRegistry = {
  'vectorSearch': VectorSearch,
  'textGeneration': TextGeneration,
  'codeExecutor': CodeExecutor,
  'webBrowser': WebBrowser,
  // Add more tools as they are implemented
};

// Parse command line arguments
const toolName = process.argv[2];
const paramsJson = process.argv[3] || '{}';
const configOption = process.argv[4]; // Optional: 'config' or 'save-config' or 'load-config'
const configPath = process.argv[5]; // Optional: path for config file

// Define commands and options
const COMMANDS = {
  CONFIG: 'config',
  SAVE_CONFIG: 'save-config',
  LOAD_CONFIG: 'load-config'
};

function showUsage() {
  console.log('Usage: npm run test-tool -- <toolName> [paramsJson] [configOption] [configPath]');
  console.log('\nAvailable tools:');
  Object.keys(TOOLS).forEach(name => {
    console.log(`  - ${name}`);
  });
  
  console.log('\nConfiguration options:');
  console.log(`  - ${COMMANDS.CONFIG}: Show current tool configuration`);
  console.log(`  - ${COMMANDS.SAVE_CONFIG} <path>: Save current configuration to file`);
  console.log(`  - ${COMMANDS.LOAD_CONFIG} <path>: Load configuration from file`);
  
  console.log('\nExample commands:');
  console.log('- npm run test-tool -- vectorSearch \'{"query":"example search"}\'');
  console.log('- npm run test-tool -- textGeneration \'{"prompt":"Summarize the benefits of AI","temperature":0.7}\'');
  console.log('- npm run test-tool -- codeExecutor \'{"code":"console.log(\'Hello, world!\');","language":"javascript"}\'');
  console.log('- npm run test-tool -- webBrowser \'{"url":"https://example.com","operation":"get"}\'');
  console.log('- npm run test-tool -- vectorSearch config');
  console.log('- npm run test-tool -- textGeneration save-config ./configs/text-gen.json');
}

// Handle configuration options if provided
if (configOption) {
  if (!toolName) {
    console.error('Error: Tool name is required');
    showUsage();
    process.exit(1);
  }
  
  // Check if tool exists
  if (!TOOLS[toolName]) {
    console.error(`Error: Tool "${toolName}" not found`);
    console.log('Available tools:');
    Object.keys(TOOLS).forEach(name => {
      console.log(`  - ${name}`);
    });
    process.exit(1);
  }
  
  switch (configOption) {
    case COMMANDS.CONFIG:
      // Show configuration
      console.log(`=== Configuration for ${toolName} ===`);
      console.log(toolsManager.getToolConfigDocumentation(toolName));
      process.exit(0);
      break;
      
    case COMMANDS.SAVE_CONFIG:
      if (!configPath) {
        console.error('Error: Config path is required for save-config');
        showUsage();
        process.exit(1);
      }
      
      // Save configuration
      if (toolsManager.saveToolConfigurations(configPath)) {
        console.log(`Configuration saved to ${configPath}`);
      } else {
        console.error(`Failed to save configuration to ${configPath}`);
        process.exit(1);
      }
      process.exit(0);
      break;
      
    case COMMANDS.LOAD_CONFIG:
      if (!configPath) {
        console.error('Error: Config path is required for load-config');
        showUsage();
        process.exit(1);
      }
      
      // Load configuration
      if (toolsManager.loadToolConfigurations(configPath)) {
        console.log(`Configuration loaded from ${configPath}`);
        console.log(`\nUpdated configuration for ${toolName}:`);
        console.log(toolsManager.getToolConfig(toolName));
      } else {
        console.error(`Failed to load configuration from ${configPath}`);
        process.exit(1);
      }
      process.exit(0);
      break;
      
    default:
      // Treat as params if not a known command
      try {
        const extraParams = JSON.parse(configOption);
        params = { ...params, ...extraParams };
      } catch (e) {
        console.error(`Unrecognized option: ${configOption}`);
        showUsage();
        process.exit(1);
      }
  }
}

// Regular tool execution path
if (!toolName) {
  console.error('Error: Tool name is required');
  showUsage();
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
    // Get the current configuration
    const toolConfig = toolsManager.getToolConfig(toolName);
    console.log('\nTool Configuration:');
    console.log(JSON.stringify(toolConfig, null, 2));
    
    // Merge with params - params take precedence
    const mergedParams = { ...toolConfig, ...params };
    console.log('\nMerged Parameters:');
    console.log(JSON.stringify(mergedParams, null, 2));
    
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
      params: mergedParams,
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

// Run the test using the tools manager
async function testToolWithManager(toolName: string, params: any) {
  console.log(`=== Testing ${toolName} Tool using ToolsManager ===`);
  console.log('Parameters:', JSON.stringify(params, null, 2));
  
  try {
    console.log('\nExecuting tool through ToolsManager...');
    const startTime = Date.now();
    
    const result = await toolsManager.useTool(toolName, params);
    
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

// Choose one of the test methods (direct or via manager)
const useManager = true; // Set to false to test direct tool instantiation

if (useManager) {
  testToolWithManager(toolName, params).catch(console.error);
} else {
  testTool(toolName, params).catch(console.error);
}

// Example usage:
// npm run test-tool -- vectorSearch '{"query":"example search"}'
// npm run test-tool -- textGeneration '{"prompt":"Summarize the benefits of AI","temperature":0.7}'
// npm run test-tool -- codeExecutor '{"code":"console.log(\"Hello, world!\");","language":"javascript"}'
// npm run test-tool -- webBrowser '{"url":"https://example.com","operation":"get"}'
// npm run test-tool -- vectorSearch config
// npm run test-tool -- textGeneration save-config ./configs/text-gen.json
// npm run test-tool -- textGeneration load-config ./configs/text-gen.json
