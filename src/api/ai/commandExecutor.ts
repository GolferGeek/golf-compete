'use client';

import { ProcessedCommand } from './profileAiService';

/**
 * Result of executing a command
 */
export interface CommandExecutionResult {
  success: boolean;
  message: string;
  action?: {
    type: 'navigate' | 'refresh' | 'modal' | 'none';
    payload?: any;
  };
}

/**
 * Executes a processed command and determines what actions to take
 */
export async function executeCommand(
  command: ProcessedCommand,
  userId: string
): Promise<CommandExecutionResult> {
  if (!command || !command.commandType) {
    return {
      success: false,
      message: 'Invalid command',
      action: { type: 'none' }
    };
  }

  // Handle different command types
  switch (command.commandType) {
    case 'start_round':
      return handleStartRoundCommand(command, userId);
    case 'record_score':
      return handleRecordScoreCommand(command, userId);
    case 'add_note':
      return handleAddNoteCommand(command, userId);
    case 'ask_question':
      // Questions just display their response without additional actions
      return {
        success: true,
        message: command.response,
        action: { type: 'none' }
      };
    default:
      return {
        success: true,
        message: command.response,
        action: { type: 'none' }
      };
  }
}

/**
 * Handles start_round commands
 */
async function handleStartRoundCommand(
  command: ProcessedCommand,
  userId: string
): Promise<CommandExecutionResult> {
  // Check if a round was already created by the server
  if (command.parameters.createdRoundId) {
    // If the round is part of an event, navigate to the event page instead
    if (command.parameters.eventId) {
      return {
        success: true,
        message: command.response,
        action: {
          type: 'navigate',
          payload: {
            path: `/events/${command.parameters.eventId}/scorecard`
          }
        }
      };
    }
    
    // Otherwise, navigate to the round scoring page as usual
    return {
      success: true,
      message: command.response,
      action: {
        type: 'navigate',
        payload: {
          path: `/rounds/${command.parameters.createdRoundId}/score`
        }
      }
    };
  }

  // If no round was created, just show the response
  return {
    success: true,
    message: command.response,
    action: { type: 'none' }
  };
}

/**
 * Handles record_score commands
 */
async function handleRecordScoreCommand(
  command: ProcessedCommand,
  userId: string
): Promise<CommandExecutionResult> {
  const roundId = command.parameters.roundId;
  
  // If we have a round ID, we could navigate to it
  if (roundId) {
    return {
      success: true,
      message: command.response,
      action: {
        type: 'navigate',
        payload: {
          path: `/rounds/${roundId}/score`
        }
      }
    };
  }
  
  return {
    success: true,
    message: command.response,
    action: { type: 'none' }
  };
}

/**
 * Handles add_note commands
 */
async function handleAddNoteCommand(
  command: ProcessedCommand,
  userId: string
): Promise<CommandExecutionResult> {
  // For notes, we just confirm without navigation
  // This keeps the flow simple and non-disruptive
  return {
    success: true,
    message: command.response,
    action: { type: 'none' }
  };
} 