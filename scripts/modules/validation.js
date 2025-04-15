import { logger } from '../utils/logger.js';

export function validateTasks(tasks) {
    if (!Array.isArray(tasks)) {
        logger.error('Tasks must be an array');
        return false;
    }

    if (tasks.length === 0) {
        logger.error('Tasks array cannot be empty');
        return false;
    }

    const ids = new Set();
    const validPriorities = ['high', 'medium', 'low'];
    const validStatuses = ['pending', 'in-progress', 'done', 'deferred'];

    for (const task of tasks) {
        // Check required fields
        if (!task.id || typeof task.id !== 'number') {
            logger.error(`Invalid or missing id in task: ${JSON.stringify(task)}`);
            return false;
        }

        if (!task.title || typeof task.title !== 'string') {
            logger.error(`Invalid or missing title in task ${task.id}`);
            return false;
        }

        if (!task.description || typeof task.description !== 'string') {
            logger.error(`Invalid or missing description in task ${task.id}`);
            return false;
        }

        // Check for duplicate IDs
        if (ids.has(task.id)) {
            logger.error(`Duplicate task ID found: ${task.id}`);
            return false;
        }
        ids.add(task.id);

        // Validate dependencies
        if (!Array.isArray(task.dependencies)) {
            logger.error(`Invalid dependencies in task ${task.id}`);
            return false;
        }

        // Validate priority
        if (!validPriorities.includes(task.priority)) {
            logger.error(`Invalid priority in task ${task.id}: ${task.priority}`);
            return false;
        }

        // Validate status
        if (!validStatuses.includes(task.status)) {
            logger.error(`Invalid status in task ${task.id}: ${task.status}`);
            return false;
        }

        // Check implementation details
        if (!task.details || typeof task.details !== 'string') {
            logger.error(`Invalid or missing details in task ${task.id}`);
            return false;
        }

        // Check test strategy
        if (!task.testStrategy || typeof task.testStrategy !== 'string') {
            logger.error(`Invalid or missing test strategy in task ${task.id}`);
            return false;
        }

        // Validate dependency references
        for (const depId of task.dependencies) {
            if (depId >= task.id) {
                logger.error(`Invalid dependency in task ${task.id}: dependency ${depId} must be less than task ID`);
                return false;
            }
        }
    }

    logger.info('Task validation successful');
    return true;
} 