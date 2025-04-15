import { readFileSync } from 'fs';
import { join } from 'path';
import { AnthropicClient } from '../utils/anthropic.js';
import { generateTasks } from './taskGenerator.js';
import { writeTasksToFile, readTasksFromFile } from './fileUtils.js';
import { validateTasks } from './validation.js';
import { logger } from '../utils/logger.js';

export async function parsePrd(options) {
    try {
        const { input = 'sample-prd.txt' } = options;
        const prdContent = readFileSync(input, 'utf-8');
        
        const anthropic = new AnthropicClient();
        const tasks = await generateTasks(prdContent, anthropic);
        
        if (validateTasks(tasks)) {
            await writeTasksToFile(tasks);
            logger.info('Tasks generated successfully');
            return tasks;
        } else {
            logger.error('Task validation failed');
            return null;
        }
    } catch (error) {
        logger.error('Error parsing PRD:', error);
        throw error;
    }
}

export async function listTasks(options) {
    try {
        const tasks = await readTasksFromFile();
        return tasks;
    } catch (error) {
        logger.error('Error listing tasks:', error);
        throw error;
    }
}

export async function updateTasks(options) {
    try {
        const { from = 1, prompt } = options;
        if (!prompt) {
            throw new Error('Prompt is required for updating tasks');
        }
        
        const tasks = await readTasksFromFile();
        // Update logic here
        
        await writeTasksToFile(tasks);
        return tasks;
    } catch (error) {
        logger.error('Error updating tasks:', error);
        throw error;
    }
}

export async function setTaskStatus(options) {
    try {
        const { id, status } = options;
        if (!id || !status) {
            throw new Error('Task ID and status are required');
        }
        
        const tasks = await readTasksFromFile();
        // Status update logic here
        
        await writeTasksToFile(tasks);
        return tasks;
    } catch (error) {
        logger.error('Error setting task status:', error);
        throw error;
    }
}

export async function expandTask(options) {
    try {
        const { id, num = 3 } = options;
        if (!id) {
            throw new Error('Task ID is required for expansion');
        }
        
        const tasks = await readTasksFromFile();
        // Expansion logic here
        
        await writeTasksToFile(tasks);
        return tasks;
    } catch (error) {
        logger.error('Error expanding task:', error);
        throw error;
    }
}

export async function clearSubtasks(options) {
    try {
        const { id } = options;
        if (!id) {
            throw new Error('Task ID is required for clearing subtasks');
        }
        
        const tasks = await readTasksFromFile();
        // Clear subtasks logic here
        
        await writeTasksToFile(tasks);
        return tasks;
    } catch (error) {
        logger.error('Error clearing subtasks:', error);
        throw error;
    }
} 