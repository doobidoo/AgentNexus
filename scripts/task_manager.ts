/**
 * Task Manager for Agent Nexus
 * 
 * This script provides functionality to manage tasks stored in individual files
 * in the tasks directory, with utilities for creating, updating, and tracking tasks.
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Path to tasks directory
const TASKS_DIR = path.join(__dirname, '../tasks');

// Status options for tasks
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked'
}

// Priority options for tasks
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Task type definition
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  details?: string;
  testStrategy?: string;
  assignee?: string;
  subtasks?: Task[];
  parentId?: string;
}

// Task update interface
export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dependencies?: string[];
  details?: string;
  testStrategy?: string;
  assignee?: string;
  subtasks?: Task[];
  parentId?: string;
}

/**
 * Get list of all task files in the tasks directory
 */
export function getTaskFiles(): string[] {
  if (!fs.existsSync(TASKS_DIR)) {
    fs.mkdirSync(TASKS_DIR, { recursive: true });
  }
  
  return fs.readdirSync(TASKS_DIR)
    .filter(file => file.startsWith('task_') && file.endsWith('.json'))
    .map(file => path.join(TASKS_DIR, file));
}

/**
 * Load a task from a file
 * @param filePath Path to the task file
 */
export function loadTask(filePath: string): Task | null {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as Task;
  } catch (error) {
    console.error(`Error loading task from ${filePath}:`, error);
    return null;
  }
}

/**
 * Save a task to a file
 * @param task Task to save
 */
export function saveTask(task: Task): boolean {
  try {
    const filePath = path.join(TASKS_DIR, `task_${task.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(task, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error saving task ${task.id}:`, error);
    return false;
  }
}

/**
 * Create a new task
 * @param taskData Task data without ID
 */
export function createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
  const now = new Date().toISOString();
  
  const newTask: Task = {
    id: uuidv4(),
    ...taskData,
    createdAt: now,
    updatedAt: now
  };
  
  saveTask(newTask);
  return newTask;
}

/**
 * Update an existing task
 * @param taskId ID of the task to update
 * @param updates Updates to apply to the task
 */
export function updateTask(taskId: string, updates: TaskUpdate): Task | null {
  const filePath = path.join(TASKS_DIR, `task_${taskId}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`Task ${taskId} not found`);
    return null;
  }
  
  const task = loadTask(filePath);
  if (!task) return null;
  
  const updatedTask: Task = {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // Set completedAt if the task is being marked as completed
  if (updates.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
    updatedTask.completedAt = new Date().toISOString();
  }
  
  // Remove completedAt if the task is being unmarked as completed
  if (updates.status && updates.status !== TaskStatus.COMPLETED && task.status === TaskStatus.COMPLETED) {
    delete updatedTask.completedAt;
  }
  
  saveTask(updatedTask);
  return updatedTask;
}

/**
 * Load all tasks
 */
export function getAllTasks(): Task[] {
  const taskFiles = getTaskFiles();
  
  return taskFiles
    .map(file => loadTask(file))
    .filter((task): task is Task => task !== null);
}

/**
 * Get tasks by status
 * @param status Status to filter by
 */
export function getTasksByStatus(status: TaskStatus): Task[] {
  return getAllTasks().filter(task => task.status === status);
}

/**
 * Get tasks by priority
 * @param priority Priority to filter by
 */
export function getTasksByPriority(priority: TaskPriority): Task[] {
  return getAllTasks().filter(task => task.priority === priority);
}

/**
 * Get tasks assigned to a specific person
 * @param assignee Assignee to filter by
 */
export function getTasksByAssignee(assignee: string): Task[] {
  return getAllTasks().filter(task => task.assignee === assignee);
}

/**
 * Create a task update file
 * @param updateText Content of the update
 */
export function createTaskUpdate(updateText: string): string {
  const updateFilePath = path.join(TASKS_DIR, `update_${new Date().toISOString().replace(/:/g, '-')}.md`);
  fs.writeFileSync(updateFilePath, updateText, 'utf-8');
  return updateFilePath;
}

/**
 * Migrate tasks from tasks.json to individual files
 */
export function migrateTasksFromJson(): void {
  const tasksJsonPath = path.join(TASKS_DIR, 'tasks.json');
  
  if (!fs.existsSync(tasksJsonPath)) {
    console.log('tasks.json not found, no migration needed');
    return;
  }
  
  try {
    const tasksData = JSON.parse(fs.readFileSync(tasksJsonPath, 'utf-8'));
    
    if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
      console.error('Invalid tasks.json format');
      return;
    }
    
    // Create backup of tasks.json
    fs.copyFileSync(tasksJsonPath, path.join(TASKS_DIR, 'tasks.json.bak'));
    
    // Process each task
    tasksData.tasks.forEach((taskData: any) => {
      // Convert task format
      const now = new Date().toISOString();
      
      const task: Task = {
        id: taskData.id.toString(),
        title: taskData.title,
        description: taskData.description,
        status: taskData.status as TaskStatus,
        priority: (taskData.priority || 'medium') as TaskPriority,
        dependencies: taskData.dependencies || [],
        createdAt: now,
        updatedAt: now,
        details: taskData.details,
        testStrategy: taskData.testStrategy,
        subtasks: []
      };
      
      // Process subtasks if available
      if (taskData.subtasks && Array.isArray(taskData.subtasks)) {
        taskData.subtasks.forEach((subtaskData: any) => {
          const subtask: Task = {
            id: `${task.id}_${subtaskData.id}`,
            title: subtaskData.title,
            description: subtaskData.description,
            status: subtaskData.status as TaskStatus,
            priority: task.priority,
            dependencies: subtaskData.dependencies || [],
            createdAt: now,
            updatedAt: now,
            details: subtaskData.details,
            parentId: task.id
          };
          
          task.subtasks!.push(subtask);
          
          // Save each subtask as its own file
          saveTask(subtask);
        });
      }
      
      // Save the parent task
      saveTask(task);
    });
    
    console.log('Migration completed successfully');
    
    // Rename the original tasks.json to indicate it's been migrated
    fs.renameSync(tasksJsonPath, path.join(TASKS_DIR, 'tasks.json.migrated'));
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

/**
 * Generate a summary of tasks
 */
export function generateTaskSummary(): string {
  const tasks = getAllTasks();
  
  const pendingCount = tasks.filter(t => t.status === TaskStatus.PENDING).length;
  const inProgressCount = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
  const completedCount = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
  const blockedCount = tasks.filter(t => t.status === TaskStatus.BLOCKED).length;
  
  const highPriorityPending = tasks.filter(
    t => t.status === TaskStatus.PENDING && t.priority === TaskPriority.HIGH
  );
  
  let summary = `# Task Summary\n\n`;
  summary += `- Pending: ${pendingCount}\n`;
  summary += `- In Progress: ${inProgressCount}\n`;
  summary += `- Completed: ${completedCount}\n`;
  summary += `- Blocked: ${blockedCount}\n\n`;
  
  summary += `## High Priority Pending Tasks\n\n`;
  highPriorityPending.forEach(task => {
    summary += `- ${task.title}\n`;
  });
  
  return summary;
}

// Export a convenience task manager object
export const TaskManager = {
  getAllTasks,
  getTasksByStatus,
  getTasksByPriority,
  getTasksByAssignee,
  createTask,
  updateTask,
  loadTask,
  saveTask,
  createTaskUpdate,
  migrateTasksFromJson,
  generateTaskSummary
};

// If this script is run directly, perform migration
if (require.main === module) {
  migrateTasksFromJson();
}
