import { appendFile } from 'fs/promises';
import { join } from 'path';

const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LOG_LEVELS.info;
const DEBUG = process.env.DEBUG === 'true';
const DEBUG_LOG_FILE = 'dev-debug.log';

function formatMessage(level, message, error = null) {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (error) {
        formattedMessage += `\n${error.stack || error}`;
    }
    return formattedMessage;
}

async function writeDebugLog(message) {
    if (DEBUG) {
        try {
            await appendFile(DEBUG_LOG_FILE, message + '\n');
        } catch (error) {
            console.error('Failed to write debug log:', error);
        }
    }
}

export const logger = {
    debug: (message, error = null) => {
        if (currentLevel <= LOG_LEVELS.debug) {
            const formattedMessage = formatMessage('debug', message, error);
            console.debug(formattedMessage);
            writeDebugLog(formattedMessage);
        }
    },

    info: (message, error = null) => {
        if (currentLevel <= LOG_LEVELS.info) {
            const formattedMessage = formatMessage('info', message, error);
            console.info(formattedMessage);
            writeDebugLog(formattedMessage);
        }
    },

    warn: (message, error = null) => {
        if (currentLevel <= LOG_LEVELS.warn) {
            const formattedMessage = formatMessage('warn', message, error);
            console.warn(formattedMessage);
            writeDebugLog(formattedMessage);
        }
    },

    error: (message, error = null) => {
        if (currentLevel <= LOG_LEVELS.error) {
            const formattedMessage = formatMessage('error', message, error);
            console.error(formattedMessage);
            writeDebugLog(formattedMessage);
        }
    }
}; 