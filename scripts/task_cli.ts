#!/usr/bin/env node
/**
 * Command-line interface for task management
 * 
 * This script provides a command-line interface for managing tasks in the Agent Nexus project.
 * It allows creating, updating, and listing tasks through simple commands.
 */

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { 
  TaskManager, 
  Task, 
  TaskStatus, 
  TaskPriority,
  getAllTasks,
  getTasksByStatus,
  getTasksByPriority,
  createTask,
  updateTask,
  loadTask
} from './task_manager';

// Set up the CLI
program
  .version('1.0.0')
  .description('Agent Nexus Task Manager CLI');

// List tasks command
program
  .command('list')
  .description('List all tasks')
  .option('-s, --status <status>', 'Filter by status (pending, in_progress, completed, blocked)')
  .option('-p, --priority <priority>', 'Filter by priority (low, medium, high, critical)')
  .option('-a, --assignee <assignee>', 'Filter by assignee')
  .action((options) => {
    const spinner = ora('Loading tasks...').start();
    
    let tasks: Task[] = [];
    
    if (options.status) {
      tasks = getTasksByStatus(options.status as TaskStatus);
    } else if (options.priority) {
      tasks = getTasksByPriority(options.priority as TaskPriority);
    } else if (options.assignee) {
      tasks = TaskManager.getTasksByAssignee(options.assignee);
    } else {
      tasks = getAllTasks();
    }
    
    spinner.stop();
    
    if (tasks.length === 0) {
      console.log(chalk.yellow('No tasks found.'));
      return;
    }
    
    tasks.forEach(task => {
      const statusColor = task.status === TaskStatus.COMPLETED ? chalk.green :
                         task.status === TaskStatus.IN_PROGRESS ? chalk.blue :
                         task.status === TaskStatus.BLOCKED ? chalk.red :
                         chalk.yellow;
      
      const priorityColor = task.priority === TaskPriority.CRITICAL ? chalk.bgRed.white :
                           task.priority === TaskPriority.HIGH ? chalk.red :
                           task.priority === TaskPriority.MEDIUM ? chalk.yellow :
                           chalk.blue;
      
      console.log(`${chalk.bold(task.id)} - ${chalk.bold(task.title)}`);
      console.log(`  Status: ${statusColor(task.status)}`);
      console.log(`  Priority: ${priorityColor(task.priority)}`);
      console.log(`  Description: ${task.description}`);
      
      if (task.dependencies.length > 0) {
        console.log(`  Dependencies: ${task.dependencies.join(', ')}`);
      }
      
      if (task.assignee) {
        console.log(`  Assignee: ${task.assignee}`);
      }
      
      console.log();
    });
    
    console.log(`Total: ${tasks.length} tasks`);
  });

// Create task command
program
  .command('create')
  .description('Create a new task')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Task title:',
        validate: (input) => input.trim() !== '' ? true : 'Title is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Task description:',
        validate: (input) => input.trim() !== '' ? true : 'Description is required'
      },
      {
        type: 'list',
        name: 'status',
        message: 'Task status:',
        choices: Object.values(TaskStatus),
        default: TaskStatus.PENDING
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Task priority:',
        choices: Object.values(TaskPriority),
        default: TaskPriority.MEDIUM
      },
      {
        type: 'input',
        name: 'dependencies',
        message: 'Dependencies (comma-separated task IDs):',
        filter: (input) => input.split(',').map((id) => id.trim()).filter(Boolean)
      },
      {
        type: 'input',
        name: 'assignee',
        message: 'Assignee (optional):'
      },
      {
        type: 'editor',
        name: 'details',
        message: 'Task details (optional):',
      },
      {
        type: 'editor',
        name: 'testStrategy',
        message: 'Test strategy (optional):',
      }
    ]);
    
    const spinner = ora('Creating task...').start();
    
    const task = createTask({
      title: answers.title,
      description: answers.description,
      status: answers.status as TaskStatus,
      priority: answers.priority as TaskPriority,
      dependencies: answers.dependencies,
      assignee: answers.assignee || undefined,
      details: answers.details || undefined,
      testStrategy: answers.testStrategy || undefined,
      subtasks: []
    });
    
    spinner.succeed(`Task created with ID: ${chalk.bold(task.id)}`);
  });

// Update task command
program
  .command('update <taskId>')
  .description('Update an existing task')
  .action(async (taskId) => {
    const spinner = ora('Loading task...').start();
    
    const task = loadTask(`task_${taskId}.json`);
    
    if (!task) {
      spinner.fail(`Task with ID ${taskId} not found.`);
      return;
    }
    
    spinner.stop();
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Task title:',
        default: task.title
      },
      {
        type: 'input',
        name: 'description',
        message: 'Task description:',
        default: task.description
      },
      {
        type: 'list',
        name: 'status',
        message: 'Task status:',
        choices: Object.values(TaskStatus),
        default: task.status
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Task priority:',
        choices: Object.values(TaskPriority),
        default: task.priority
      },
      {
        type: 'input',
        name: 'dependencies',
        message: 'Dependencies (comma-separated task IDs):',
        default: task.dependencies.join(', '),
        filter: (input) => input.split(',').map((id) => id.trim()).filter(Boolean)
      },
      {
        type: 'input',
        name: 'assignee',
        message: 'Assignee (optional):',
        default: task.assignee || ''
      },
      {
        type: 'editor',
        name: 'details',
        message: 'Task details (optional):',
        default: task.details || ''
      },
      {
        type: 'editor',
        name: 'testStrategy',
        message: 'Test strategy (optional):',
        default: task.testStrategy || ''
      }
    ]);
    
    spinner.start('Updating task...');
    
    const updatedTask = updateTask(task.id, {
      title: answers.title,
      description: answers.description,
      status: answers.status as TaskStatus,
      priority: answers.priority as TaskPriority,
      dependencies: answers.dependencies,
      assignee: answers.assignee || undefined,
      details: answers.details || undefined,
      testStrategy: answers.testStrategy || undefined
    });
    
    if (updatedTask) {
      spinner.succeed(`Task ${chalk.bold(task.id)} updated successfully.`);
    } else {
      spinner.fail(`Failed to update task ${chalk.bold(task.id)}.`);
    }
  });

// View task command
program
  .command('view <taskId>')
  .description('View task details')
  .action((taskId) => {
    const spinner = ora('Loading task...').start();
    
    const task = loadTask(`task_${taskId}.json`);
    
    if (!task) {
      spinner.fail(`Task with ID ${taskId} not found.`);
      return;
    }
    
    spinner.stop();
    
    console.log(chalk.bold(`Task: ${task.title} (${task.id})`));
    console.log(chalk.dim('-----------------------------------'));
    console.log(`Description: ${task.description}`);
    console.log(`Status: ${chalk.bold(task.status)}`);
    console.log(`Priority: ${chalk.bold(task.priority)}`);
    
    if (task.dependencies.length > 0) {
      console.log(`Dependencies: ${task.dependencies.join(', ')}`);
    }
    
    if (task.assignee) {
      console.log(`Assignee: ${task.assignee}`);
    }
    
    console.log(`Created: ${new Date(task.createdAt).toLocaleString()}`);
    console.log(`Updated: ${new Date(task.updatedAt).toLocaleString()}`);
    
    if (task.completedAt) {
      console.log(`Completed: ${new Date(task.completedAt).toLocaleString()}`);
    }
    
    if (task.details) {
      console.log(chalk.dim('-----------------------------------'));
      console.log(chalk.bold('Details:'));
      console.log(task.details);
    }
    
    if (task.testStrategy) {
      console.log(chalk.dim('-----------------------------------'));
      console.log(chalk.bold('Test Strategy:'));
      console.log(task.testStrategy);
    }
    
    if (task.subtasks && task.subtasks.length > 0) {
      console.log(chalk.dim('-----------------------------------'));
      console.log(chalk.bold('Subtasks:'));
      
      task.subtasks.forEach(subtask => {
        console.log(`- [${subtask.status === TaskStatus.COMPLETED ? 'x' : ' '}] ${subtask.title} (${subtask.id})`);
      });
    }
  });

// Generate summary command
program
  .command('summary')
  .description('Generate a summary of all tasks')
  .action(() => {
    const spinner = ora('Generating summary...').start();
    
    const summary = TaskManager.generateTaskSummary();
    
    spinner.stop();
    
    console.log(summary);
  });

// Add subtask command
program
  .command('add-subtask <parentId>')
  .description('Add a subtask to an existing task')
  .action(async (parentId) => {
    const spinner = ora('Loading parent task...').start();
    
    const parentTask = loadTask(`task_${parentId}.json`);
    
    if (!parentTask) {
      spinner.fail(`Parent task with ID ${parentId} not found.`);
      return;
    }
    
    spinner.stop();
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Subtask title:',
        validate: (input) => input.trim() !== '' ? true : 'Title is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Subtask description:',
        validate: (input) => input.trim() !== '' ? true : 'Description is required'
      },
      {
        type: 'list',
        name: 'status',
        message: 'Subtask status:',
        choices: Object.values(TaskStatus),
        default: TaskStatus.PENDING
      },
      {
        type: 'input',
        name: 'dependencies',
        message: 'Dependencies (comma-separated task IDs):',
        filter: (input) => input.split(',').map((id) => id.trim()).filter(Boolean)
      },
      {
        type: 'editor',
        name: 'details',
        message: 'Subtask details (optional):',
      }
    ]);
    
    spinner.start('Creating subtask...');
    
    // Generate a unique ID for the subtask
    const subtaskId = `${parentId}_${parentTask.subtasks?.length || 0 + 1}`;
    
    const subtask = createTask({
      title: answers.title,
      description: answers.description,
      status: answers.status as TaskStatus,
      priority: parentTask.priority,
      dependencies: answers.dependencies,
      details: answers.details || undefined,
      parentId: parentId
    });
    
    // Update the parent task to include the new subtask
    if (!parentTask.subtasks) {
      parentTask.subtasks = [];
    }
    
    parentTask.subtasks.push(subtask);
    TaskManager.saveTask(parentTask);
    
    spinner.succeed(`Subtask created with ID: ${chalk.bold(subtask.id)}`);
  });

// Complete task command
program
  .command('complete <taskId>')
  .description('Mark a task as completed')
  .action((taskId) => {
    const spinner = ora(`Marking task ${taskId} as completed...`).start();
    
    const updatedTask = updateTask(taskId, {
      status: TaskStatus.COMPLETED
    });
    
    if (updatedTask) {
      spinner.succeed(`Task ${chalk.bold(taskId)} marked as completed.`);
    } else {
      spinner.fail(`Failed to mark task ${chalk.bold(taskId)} as completed.`);
    }
  });

// Start task command
program
  .command('start <taskId>')
  .description('Mark a task as in progress')
  .action((taskId) => {
    const spinner = ora(`Marking task ${taskId} as in progress...`).start();
    
    const updatedTask = updateTask(taskId, {
      status: TaskStatus.IN_PROGRESS
    });
    
    if (updatedTask) {
      spinner.succeed(`Task ${chalk.bold(taskId)} marked as in progress.`);
    } else {
      spinner.fail(`Failed to mark task ${chalk.bold(taskId)} as in progress.`);
    }
  });

// Create task update command
program
  .command('update-report')
  .description('Create a task update report')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'editor',
        name: 'updateText',
        message: 'Enter the update report:'
      }
    ]);
    
    const spinner = ora('Creating update report...').start();
    
    const filePath = TaskManager.createTaskUpdate(answers.updateText);
    
    spinner.succeed(`Update report created at: ${chalk.bold(filePath)}`);
  });

// Parse arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.help();
}
