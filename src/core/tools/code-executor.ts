/**
 * CodeExecutor Tool for Agent Nexus
 * 
 * Provides secure code execution capabilities in a sandboxed environment.
 * Currently supports JavaScript execution via a simulated environment.
 * 
 * NOTE: This is a simplified implementation for demonstration purposes.
 * In a production environment, you would use a more secure sandboxing solution.
 */

import { AbstractTool, ToolInput, ToolOutput } from './base';

export interface CodeExecutorParams {
  code: string;
  language: 'javascript' | 'python' | 'bash';
  timeout?: number; // in milliseconds
  args?: any[];
  context?: any;
}

export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  returnValue?: any;
  executionTime: number;
  success: boolean;
}

export class CodeExecutor extends AbstractTool {
  constructor() {
    super(
      'codeExecutor',
      'Execute code in a secure sandboxed environment',
      ['code execution', 'javascript', 'python', 'bash', 'scripting'],
      '1.0.0'
    );
  }
  
  /**
   * Validate the code execution parameters
   * 
   * @param input Tool input to validate
   * @returns Boolean indicating if the input is valid
   */
  validate(input: ToolInput): boolean {
    const params = input.params as CodeExecutorParams;
    
    if (!params) return false;
    if (typeof params.code !== 'string' || params.code.trim() === '') return false;
    if (!['javascript', 'python', 'bash'].includes(params.language)) return false;
    
    // Optional parameter validation
    if (params.timeout !== undefined && (typeof params.timeout !== 'number' || params.timeout <= 0)) return false;
    
    return true;
  }
  
  /**
   * Execute code with the provided parameters
   * 
   * @param input Code execution parameters and context
   * @returns Result of code execution
   */
  async execute(input: ToolInput): Promise<ToolOutput> {
    try {
      // Validate input
      if (!this.validate(input)) {
        return this.createErrorOutput('Invalid input parameters', input);
      }
      
      const params = input.params as CodeExecutorParams;
      const { 
        code,
        language,
        timeout = 5000, // Default 5 second timeout
        args = [],
        context = {}
      } = params;
      
      console.log(`Executing ${language} code (${code.length} chars)`);
      
      // Execute the code based on language
      let result: CodeExecutionResult;
      
      switch (language) {
        case 'javascript':
          result = await this.executeJavaScript(code, timeout, args, context);
          break;
        case 'python':
          result = await this.simulatePythonExecution(code, timeout, args, context);
          break;
        case 'bash':
          result = await this.simulateBashExecution(code, timeout, args, context);
          break;
        default:
          return this.createErrorOutput(`Unsupported language: ${language}`, input);
      }
      
      // Return the execution result
      return this.createSuccessOutput(result, input);
    } catch (error) {
      console.error('Error in code execution:', error);
      return this.createErrorOutput(`Code execution failed: ${error}`, input);
    }
  }
  
  /**
   * Execute JavaScript code in a sandboxed environment
   * 
   * @param code The JavaScript code to execute
   * @param timeoutMs Maximum execution time in milliseconds
   * @param args Arguments to pass to the code
   * @param context Additional context for execution
   * @returns Result of JavaScript execution
   */
  private async executeJavaScript(
    code: string, 
    timeoutMs: number,
    args: any[],
    context: any
  ): Promise<CodeExecutionResult> {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const startTime = Date.now();
    
    // Create a safe execution context
    const sandbox = {
      console: {
        log: (...args: any[]) => stdout.push(args.map(arg => String(arg)).join(' ')),
        error: (...args: any[]) => stderr.push(args.map(arg => String(arg)).join(' ')),
        warn: (...args: any[]) => stderr.push('[WARN] ' + args.map(arg => String(arg)).join(' ')),
        info: (...args: any[]) => stdout.push('[INFO] ' + args.map(arg => String(arg)).join(' ')),
      },
      setTimeout: (fn: Function, delay: number) => {
        // Convert to safe timeout that respects our overall timeout
        const safeDelay = Math.min(delay, Math.max(0, timeoutMs - (Date.now() - startTime)));
        if (safeDelay <= 0) return 0;
        return setTimeout(fn, safeDelay);
      },
      args,
      context,
      // Add safe versions of other standard globals as needed
    };
    
    // Wrap code in a try-catch block
    const wrappedCode = `
      try {
        // User code
        ${code}
      } catch (error) {
        console.error('Execution error: ' + error.message);
        return { error: error.message };
      }
    `;
    
    let returnValue: any;
    let success = true;
    
    try {
      // Set timeout for execution
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Execution timed out')), timeoutMs);
      });
      
      // Execute the code
      const executionPromise = new Promise<any>(resolve => {
        try {
          // Create a new Function from the code
          // This is simplified and not fully secure
          // In production, use a proper sandboxing solution
          const fn = new Function('sandbox', `
            with (sandbox) {
              return (async function() {
                ${wrappedCode}
              })();
            }
          `);
          
          // Execute the function with the sandbox
          resolve(fn(sandbox));
        } catch (error) {
          stderr.push(`Execution error: ${error instanceof Error ? error.message : String(error)}`);
          resolve({ error: error instanceof Error ? error.message : String(error) });
        }
      });
      
      // Race the execution against the timeout
      returnValue = await Promise.race([executionPromise, timeoutPromise]);
      
      // Check if there was an error
      if (returnValue && returnValue.error) {
        stderr.push(returnValue.error);
        success = false;
      }
    } catch (error) {
      stderr.push(`${error instanceof Error ? error.message : String(error)}`);
      success = false;
    }
    
    const executionTime = Date.now() - startTime;
    
    return {
      stdout: stdout.join('\n'),
      stderr: stderr.join('\n'),
      returnValue: returnValue && returnValue.error ? undefined : returnValue,
      executionTime,
      success
    };
  }
  
  /**
   * Simulate Python code execution (for demonstration purposes)
   * In a real implementation, this would use a Python interpreter
   * 
   * @param code The Python code to execute
   * @param timeoutMs Maximum execution time in milliseconds
   * @param args Arguments to pass to the code
   * @param context Additional context for execution
   * @returns Simulated result of Python execution
   */
  private async simulatePythonExecution(
    code: string, 
    timeoutMs: number,
    args: any[],
    context: any
  ): Promise<CodeExecutionResult> {
    // Simulate execution delay
    const executionTime = Math.min(timeoutMs, code.length * 2);
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Generate sample output based on the code
    const stdout: string[] = [];
    const stderr: string[] = [];
    
    // Simple code analysis for demonstration
    if (code.includes('print(')) {
      const printStatements = code.match(/print\((.*?)\)/g) || [];
      printStatements.forEach(statement => {
        // Extract content within print()
        const content = statement.substring(6, statement.length - 1);
        stdout.push(`Simulated print output: ${content}`);
      });
    }
    
    if (code.includes('import ')) {
      const imports = code.match(/import (.*?)($|\n)/g) || [];
      imports.forEach(statement => {
        stdout.push(`Simulated import of module: ${statement.substring(7).trim()}`);
      });
    }
    
    // Check for syntax errors
    const hasValidSyntax = !code.includes('syntax error');
    if (!hasValidSyntax) {
      stderr.push('Simulated Python SyntaxError: invalid syntax');
    }
    
    // Check for specific known keywords or functions
    if (code.includes('pandas') || code.includes('pd.')) {
      stdout.push('Simulated pandas DataFrame operations');
    }
    
    if (code.includes('numpy') || code.includes('np.')) {
      stdout.push('Simulated numpy array calculations');
    }
    
    if (code.includes('matplotlib') || code.includes('plt.')) {
      stdout.push('Simulated matplotlib plot generation (image output not available)');
    }
    
    return {
      stdout: stdout.join('\n'),
      stderr: stderr.join('\n'),
      returnValue: hasValidSyntax ? 'Simulated Python execution result' : undefined,
      executionTime,
      success: hasValidSyntax
    };
  }
  
  /**
   * Simulate Bash script execution (for demonstration purposes)
   * In a real implementation, this would use a proper bash executor
   * 
   * @param code The Bash code to execute
   * @param timeoutMs Maximum execution time in milliseconds
   * @param args Arguments to pass to the code
   * @param context Additional context for execution
   * @returns Simulated result of Bash execution
   */
  private async simulateBashExecution(
    code: string, 
    timeoutMs: number,
    args: any[],
    context: any
  ): Promise<CodeExecutionResult> {
    // Simulate execution delay
    const executionTime = Math.min(timeoutMs, code.length);
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Generate sample output based on the code
    const stdout: string[] = [];
    const stderr: string[] = [];
    
    // Simple code analysis for demonstration
    if (code.includes('echo ')) {
      const echoStatements = code.match(/echo\s+(.*?)($|\n)/g) || [];
      echoStatements.forEach(statement => {
        // Extract content after echo
        const content = statement.substring(5).trim();
        stdout.push(`Simulated echo output: ${content}`);
      });
    }
    
    if (code.includes('ls')) {
      stdout.push('Simulated file listing:\nfile1.txt\nfile2.txt\ndirectory1/\ndirectory2/');
    }
    
    if (code.includes('cd ')) {
      const cdStatements = code.match(/cd\s+(.*?)($|\n)/g) || [];
      cdStatements.forEach(statement => {
        // Extract directory
        const directory = statement.substring(3).trim();
        stdout.push(`Simulated change directory to: ${directory}`);
      });
    }
    
    if (code.includes('grep ')) {
      stdout.push('Simulated grep search results:\nmatched line 1\nmatched line 2');
    }
    
    // Check for command not found
    const invalidCommands = ['invalid-command', 'nonexistent-tool'];
    const hasInvalidCommand = invalidCommands.some(cmd => code.includes(cmd));
    
    if (hasInvalidCommand) {
      stderr.push('Simulated bash error: command not found');
    }
    
    return {
      stdout: stdout.join('\n'),
      stderr: stderr.join('\n'),
      returnValue: hasInvalidCommand ? 1 : 0, // Exit code
      executionTime,
      success: !hasInvalidCommand
    };
  }
}
