import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { logger } from '../utils/logger.js';

const TASKS_DIR = 'tasks';
const TASKS_FILE = 'tasks.json';

export async function ensureTasksDirectory() {
    try {
        await mkdir(TASKS_DIR, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

export async function writeTasksToFile(tasks) {
    try {
        await ensureTasksDirectory();
        const tasksWithMeta = {
            meta: {
                lastUpdated: new Date().toISOString(),
                totalTasks: tasks.length,
                projectName: process.env.PROJECT_NAME || 'Golf Compete API Conversion',
                version: process.env.PROJECT_VERSION || '1.0.0'
            },
            tasks
        };
        
        const filePath = join(TASKS_DIR, TASKS_FILE);
        await writeFile(filePath, JSON.stringify(tasksWithMeta, null, 2));
        logger.info(`Wrote ${tasks.length} tasks to ${filePath}`);
        
        // Generate individual task files
        for (const task of tasks) {
            await writeTaskFile(task);
        }
    } catch (error) {
        logger.error('Error writing tasks to file:', error);
        throw error;
    }
}

export async function readTasksFromFile() {
    try {
        const filePath = join(TASKS_DIR, TASKS_FILE);
        const content = await readFile(filePath, 'utf-8');
        const { tasks } = JSON.parse(content);
        return tasks;
    } catch (error) {
        if (error.code === 'ENOENT') {
            logger.warn('No tasks file found');
            return [];
        }
        logger.error('Error reading tasks from file:', error);
        throw error;
    }
}

async function writeTaskFile(task) {
    try {
        const fileName = `task_${String(task.id).padStart(3, '0')}.txt`;
        const filePath = join(TASKS_DIR, fileName);
        
        const content = `# Task ID: ${task.id}
# Title: ${task.title}
# Status: ${task.status}
# Dependencies: ${task.dependencies.join(', ')}
# Priority: ${task.priority}
# Description: ${task.description}

# Details:
${task.details}

# Test Strategy:
${task.testStrategy}
`;
        
        await writeFile(filePath, content);
        logger.debug(`Wrote task file: ${fileName}`);
    } catch (error) {
        logger.error(`Error writing task file for task ${task.id}:`, error);
        throw error;
    }
} 