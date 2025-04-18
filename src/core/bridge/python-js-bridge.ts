// src/core/bridge/index.ts
/**
 * Python-JavaScript Integration Bridge
 * 
 * This module provides a bridge between the JavaScript frontend and Python backend.
 * It handles communication, data format conversion, and error handling.
 */

import { spawn } from 'child_process';
import path from 'path';
import { ModelMessage } from '../models/base';

interface PythonRequest {
  action: string;
  data: any;
}

interface PythonResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class PythonBridge {
  private pythonPath: string;
  private scriptPath: string;
  
  constructor(pythonPath = 'python', scriptPath = './scripts/agno_bridge.py') {
    this.pythonPath = pythonPath;
    this.scriptPath = path.resolve(process.cwd(), scriptPath);
  }
  
  /**
   * Call a Python function through the bridge
   * 
   * @param action The action to perform
   * @param data The data to pass to the Python function
   * @returns The result from the Python function
   */
  async call<T>(action: string, data: any): Promise<T> {
    const request: PythonRequest = { action, data };
    
    return new Promise<T>((resolve, reject) => {
      try {
        // Spawn a Python process
        const pythonProcess = spawn(this.pythonPath, [this.scriptPath]);
        
        let outputData = '';
        let errorData = '';
        
        // Collect output data
        pythonProcess.stdout.on('data', (data) => {
          outputData += data.toString();
        });
        
        // Collect error data
        pythonProcess.stderr.on('data', (data) => {
          errorData += data.toString();
        });
        
        // Send request data
        pythonProcess.stdin.write(JSON.stringify(request));
        pythonProcess.stdin.end();
        
        // Handle process completion
        pythonProcess.on('close', (code) => {
          if (code !== 0) {
            return reject(new Error(`Python process exited with code ${code}: ${errorData}`));
          }
          
          try {
            // Parse the response
            const response: PythonResponse = JSON.parse(outputData);
            
            if (!response.success) {
              return reject(new Error(response.error || 'Unknown Python error'));
            }
            
            resolve(response.data as T);
          } catch (error) {
            reject(new Error(`Failed to parse Python response: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        });
      } catch (error) {
        reject(new Error(`Failed to spawn Python process: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    });
  }
  
  /**
   * Initialize the agno agent
   * 
   * @param config The agent configuration
   * @returns The initialized agent
   */
  async initializeAgent(config: any) {
    return this.call<any>('initialize_agent', config);
  }
  
  /**
   * Generate a completion using the agno agent
   * 
   * @param messages The messages to generate a completion from
   * @param options The completion options
   * @returns The generated completion
   */
  async generateCompletion(messages: ModelMessage[], options: any) {
    return this.call<string>('generate_completion', { messages, options });
  }
  
  /**
   * Execute a tool using the agno agent
   * 
   * @param toolName The name of the tool to execute
   * @param params The parameters for the tool
   * @returns The result of the tool execution
   */
  async executeTool(toolName: string, params: any) {
    return this.call<any>('execute_tool', { toolName, params });
  }
  
  /**
   * Check if the Python bridge is available
   * 
   * @returns True if the bridge is available, false otherwise
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Simple ping to check if Python bridge is available
      await this.call<boolean>('ping', {});
      return true;
    } catch (error) {
      console.warn('Python bridge is not available:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
}

// Create a singleton instance
export const pythonBridge = new PythonBridge();

// Export common functions
export async function initializeAgnoAgent(config: any) {
  try {
    return await pythonBridge.initializeAgent(config);
  } catch (error) {
    console.error('Failed to initialize Agno agent:', error);
    throw error;
  }
}

export async function executeAgnoTool(toolName: string, params: any) {
  try {
    return await pythonBridge.executeTool(toolName, params);
  } catch (error) {
    console.error(`Failed to execute Agno tool ${toolName}:`, error);
    throw error;
  }
}
