/**
 * Project Nexus Standards Loader
 * 
 * This script implements the nexus-standards command functionality
 * by loading component-specific standards from the documentation directory.
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';

// Component to filename mapping
const componentMap: Record<string, string> = {
  'memory': 'memory-system.md',
  'planning': 'planning-system.md',
  'action': 'action-system.md',
  'tools': 'tool-system.md',
  'web': 'web-automation.md',
};

/**
 * Loads standards documentation for a specific component
 * @param component The component name (memory, planning, action, tools, web)
 * @returns The standards documentation as a string
 */
export async function loadStandards(component: string): Promise<string> {
  const normalizedComponent = component.toLowerCase().trim();
  
  if (!componentMap[normalizedComponent]) {
    const availableComponents = Object.keys(componentMap).join(', ');
    throw new Error(
      `Unknown component: ${normalizedComponent}. Available components: ${availableComponents}`
    );
  }
  
  const filename = componentMap[normalizedComponent];
  const filePath = resolve(__dirname, '../../docs/standards', filename);
  
  try {
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load standards for ${normalizedComponent}: ${errorMessage}`);
  }
}

/**
 * Command handler for nexus-standards
 * @param args Command arguments
 */
export async function handleStandardsCommand(args: string[]): Promise<void> {
  if (args.length !== 1) {
    console.error('Usage: nexus-standards [component]');
    console.error('Available components: memory, planning, action, tools, web');
    return;
  }
  
  try {
    const content = await loadStandards(args[0]);
    console.log(content);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(errorMessage);
  }
}

// For CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  handleStandardsCommand(args);
}
