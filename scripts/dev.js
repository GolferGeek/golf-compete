#!/usr/bin/env node

/**
 * dev.js
 * Task Master CLI - AI-driven development task management
 * 
 * This is the refactored entry point that uses the modular architecture.
 * It imports functionality from the modules directory and provides a CLI.
 */

// Add at the very beginning of the file
if (process.env.DEBUG === '1') {
  console.error('DEBUG - dev.js received args:', process.argv.slice(2));
}

import { config } from 'dotenv';
import { parsePrd, listTasks, updateTasks, setTaskStatus, expandTask, clearSubtasks } from './modules/commands.js';
import { logger } from './utils/logger.js';

// Load environment variables
config();

async function main() {
    const command = process.argv[2];
    const args = process.argv.slice(3);
    const options = parseArgs(args);

    try {
        switch (command) {
            case 'parse-prd':
                await parsePrd(options);
                break;
            case 'list':
                await listTasks(options);
                break;
            case 'update':
                await updateTasks(options);
                break;
            case 'set-status':
                await setTaskStatus(options);
                break;
            case 'expand':
                await expandTask(options);
                break;
            case 'clear-subtasks':
                await clearSubtasks(options);
                break;
            case '--help':
            case '-h':
                showHelp();
                break;
            default:
                logger.error(`Unknown command: ${command}`);
                showHelp();
                process.exit(1);
        }
    } catch (error) {
        logger.error('Command failed:', error);
        process.exit(1);
    }
}

function parseArgs(args) {
    const options = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            options[key] = value || args[++i];
        }
    }
    return options;
}

function showHelp() {
    console.log(`
Usage: node scripts/dev.js <command> [options]

Commands:
  parse-prd        Generate tasks from a PRD document
    --input        Path to PRD file (default: sample-prd.txt)

  list            List all tasks
    --status      Filter by status
    --with-subtasks Show subtasks

  update          Update tasks based on new information
    --from        Task ID to start from (default: 1)
    --prompt      Update description

  set-status      Change a task's status
    --id          Task ID
    --status      New status

  expand          Add subtasks to a task
    --id          Task ID
    --num         Number of subtasks (default: 3)
    --prompt      Additional context

  clear-subtasks  Remove subtasks from a task
    --id          Task ID
    --all         Clear all tasks' subtasks

Options:
  --help, -h     Show this help message
`);
}

main().catch(error => {
    logger.error('Unhandled error:', error);
    process.exit(1);
}); 