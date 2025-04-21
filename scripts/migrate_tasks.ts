/**
 * Migration script to convert tasks.json to individual task files
 *
 * This script will convert the tasks.json file to individual task files
 * in the tasks directory, with each task saved as its own JSON file.
 */

import { migrateTasksFromJson } from './task_manager';

console.log('Starting task migration...');
migrateTasksFromJson();
console.log('Task migration completed.');
