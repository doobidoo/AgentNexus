/**
 * Task Nexus Bridge
 * 
 * This script connects claude-task-master with the Agent Nexus architecture,
 * enabling tasks to be processed by the cognitive agent.
 */

import * as fs from 'fs';
import * as path from 'path';
import { AgentNexus } from '../src/core/agent';

// Configuration
const TASKS_DIR = path.join(process.cwd(), 'tasks');
const TASKS_FILE = path.join(TASKS_DIR, 'tasks.json');

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  dependencies: number[];
  priority: string;
  details?: string;
  testStrategy?: string;
  subtasks?: any[];
}

interface TasksData {
  tasks: Task[];
  metadata: {
    projectName: string;
    totalTasks: number;
    sourceFile: string;
    generatedAt: string;
  };
}

/**
 * Load tasks from the tasks.json file
 * 
 * @returns Parsed tasks data
 */
function loadTasks(): TasksData {
  try {
    const tasksData = fs.readFileSync(TASKS_FILE, 'utf-8');
    return JSON.parse(tasksData) as TasksData;
  } catch (error) {
    console.error('Error loading tasks:', error);
    throw new Error('Failed to load tasks.json');
  }
}

/**
 * Save updated tasks data to the tasks.json file
 * 
 * @param tasksData The tasks data to save
 */
function saveTasks(tasksData: TasksData): void {
  try {
    // Create a backup first
    const backupPath = `${TASKS_FILE}.bak`;
    if (fs.existsSync(TASKS_FILE)) {
      fs.copyFileSync(TASKS_FILE, backupPath);
    }
    
    // Write the updated file
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasksData, null, 2), 'utf-8');
    console.log('Tasks file updated successfully');
  } catch (error) {
    console.error('Error saving tasks:', error);
    throw new Error('Failed to save tasks.json');
  }
}

/**
 * Get the next task to process based on dependencies and status
 * 
 * @param tasksData The tasks data to search
 * @returns The next task to process or null if none are available
 */
function getNextTask(tasksData: TasksData): Task | null {
  // Find tasks that are pending and have all dependencies completed
  const eligibleTasks = tasksData.tasks.filter(task => {
    if (task.status !== 'pending') return false;
    
    // Check that all dependencies are completed
    return task.dependencies.every(depId => {
      const depTask = tasksData.tasks.find(t => t.id === depId);
      return depTask && depTask.status === 'completed';
    });
  });
  
  // Sort by priority (high > medium > low)
  const priorityOrder: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1
  };
  
  eligibleTasks.sort((a, b) => 
    (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
  );
  
  return eligibleTasks.length > 0 ? eligibleTasks[0] : null;
}

/**
 * Update a task's status
 * 
 * @param tasksData The tasks data to update
 * @param taskId The ID of the task to update
 * @param status The new status
 * @returns The updated tasks data
 */
function updateTaskStatus(tasksData: TasksData, taskId: number, status: string): TasksData {
  const updatedTasks = { ...tasksData };
  
  const taskIndex = updatedTasks.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    throw new Error(`Task with ID ${taskId} not found`);
  }
  
  updatedTasks.tasks[taskIndex] = {
    ...updatedTasks.tasks[taskIndex],
    status
  };
  
  return updatedTasks;
}

/**
 * Process a task using Agent Nexus
 * 
 * @param task The task to process
 */
async function processTask(task: Task): Promise<string> {
  console.log(`Processing task ${task.id}: ${task.title}`);
  
  try {
    // Initialize the agent
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    const agent = new AgentNexus({
      apiKey,
      name: "Agent Nexus",
      description: "An advanced cognitive agent architecture for software development"
    });
    
    // Prepare the task description
    let taskDescription = `${task.title}\n\n${task.description}`;
    
    if (task.details) {
      taskDescription += `\n\nDetails:\n${task.details}`;
    }
    
    if (task.testStrategy) {
      taskDescription += `\n\nTest Strategy:\n${task.testStrategy}`;
    }
    
    // Process the task
    console.log('Sending task to Agent Nexus...');
    const result = await agent.processTask(taskDescription);
    
    console.log('Task processing complete');
    return result;
  } catch (error) {
    console.error('Error processing task:', error);
    throw new Error(`Failed to process task: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Main function to run the task-nexus bridge
 */
async function main() {
  try {
    console.log('Starting Task Nexus Bridge...');
    
    // Load tasks
    const tasksData = loadTasks();
    console.log(`Loaded ${tasksData.tasks.length} tasks from tasks.json`);
    
    // Get the next task to process
    const nextTask = getNextTask(tasksData);
    
    if (!nextTask) {
      console.log('No eligible tasks to process.');
      return;
    }
    
    console.log(`Selected task ${nextTask.id}: ${nextTask.title}`);
    
    // Update task status to in-progress
    const updatedTasksData = updateTaskStatus(tasksData, nextTask.id, 'in-progress');
    saveTasks(updatedTasksData);
    
    // Process the task
    const result = await processTask(nextTask);
    
    // Log the result
    console.log('Task processing result:');
    console.log(result);
    
    // Save the result to a file
    const resultPath = path.join(TASKS_DIR, `task_${nextTask.id}_result.txt`);
    fs.writeFileSync(resultPath, result, 'utf-8');
    console.log(`Result saved to ${resultPath}`);
    
    // Update task status to completed
    const finalTasksData = updateTaskStatus(updatedTasksData, nextTask.id, 'completed');
    saveTasks(finalTasksData);
    
    console.log(`Task ${nextTask.id} marked as completed.`);
  } catch (error) {
    console.error('Error in Task Nexus Bridge:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
