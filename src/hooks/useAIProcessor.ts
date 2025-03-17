'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { handleAIInteraction, ProcessedCommand } from '@/services/ai/profileAiService';
import { executeCommand, CommandExecutionResult } from '@/services/ai/commandExecutor';
import { logAiStep } from '@/utils/aiDebug';

interface AIProcessorOptions {
  /**
   * Optional context data to provide to the AI
   */
  contextData?: {
    roundId?: string;
    holeNumber?: number;
    courseId?: string;
    [key: string]: any;
  };
  
  /**
   * Optional interaction type (defaults to voice_command)
   */
  interactionType?: 'voice_command' | 'text_command' | 'note' | 'question';
}

interface AIProcessorResult {
  /**
   * Process audio input
   */
  processAudio: (audioBlob: Blob) => Promise<void>;
  
  /**
   * Process text input
   */
  processText: (text: string) => Promise<void>;
  
  /**
   * Is the AI currently processing?
   */
  isProcessing: boolean;
  
  /**
   * Last response from the AI
   */
  response: string;
  
  /**
   * Last processed command from the AI
   */
  lastCommand: ProcessedCommand | null;
  
  /**
   * Last execution result
   */
  lastResult: CommandExecutionResult | null;
  
  /**
   * Debug messages from AI processing
   */
  debugMessages: string[];
}

/**
 * Hook for processing AI interactions
 */
export function useAIProcessor(options: AIProcessorOptions = {}): AIProcessorResult {
  const { contextData = {}, interactionType = 'voice_command' } = options;
  const { user } = useAuth();
  const router = useRouter();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [response, setResponse] = useState('');
  const [lastCommand, setLastCommand] = useState<ProcessedCommand | null>(null);
  const [lastResult, setLastResult] = useState<CommandExecutionResult | null>(null);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  
  // Helper to add debug messages
  const addDebugMessage = (message: string) => {
    setDebugMessages(prev => [...prev, message]);
  };
  
  /**
   * Process audio and handle the result
   */
  const processAudio = async (audioBlob: Blob) => {
    logAiStep('useAIProcessor.processAudio called with blob', { size: audioBlob.size });
    addDebugMessage(`Starting audio processing (${audioBlob.size} bytes)`);
    
    if (!user?.id) {
      logAiStep('User not authenticated');
      addDebugMessage('Authentication required: User not logged in');
      setResponse('You need to be logged in to use the AI assistant.');
      return;
    }
    
    setIsProcessing(true);
    logAiStep('Set isProcessing to true');
    addDebugMessage('Starting AI processing...');
    
    try {
      // Process with AI service
      logAiStep('About to call handleAIInteraction', { 
        userId: user.id,
        audioSize: audioBlob.size,
        contextData 
      });
      addDebugMessage('Sending audio to AI service for transcription and processing');
      
      const result = await handleAIInteraction({
        userId: user.id,
        audioBlob,
        interactionType,
        contextData
      });
      
      logAiStep('handleAIInteraction returned', { 
        response: result.response,
        commandType: result.processedCommand?.commandType
      });
      addDebugMessage(`AI response received: "${result.response.substring(0, 50)}${result.response.length > 50 ? '...' : ''}"`);
      
      setResponse(result.response);
      setLastCommand(result.processedCommand || null);
      
      // Execute the command if it exists
      if (result.processedCommand) {
        logAiStep('Command found, about to execute', { 
          commandType: result.processedCommand.commandType,
          parameters: result.processedCommand.parameters
        });
        addDebugMessage(`Executing command: ${result.processedCommand.commandType}`);
        
        const executionResult = await executeCommand(
          result.processedCommand,
          user.id
        );
        
        logAiStep('Command execution result', { 
          success: executionResult.success,
          message: executionResult.message,
          actionType: executionResult.action?.type
        });
        addDebugMessage(`Command execution ${executionResult.success ? 'successful' : 'failed'}`);
        
        setLastResult(executionResult);
        
        // Handle navigation if needed
        if (
          executionResult.action?.type === 'navigate' && 
          executionResult.action.payload?.path
        ) {
          logAiStep('Navigation action detected', { 
            path: executionResult.action.payload.path 
          });
          addDebugMessage(`Navigating to: ${executionResult.action.payload.path}`);
          
          setTimeout(() => {
            logAiStep('Navigating now');
            router.push(executionResult.action!.payload.path);
          }, 1500);
        }
      } else {
        logAiStep('No command to execute');
        addDebugMessage('No specific command to execute');
      }
    } catch (error) {
      console.error('❌ TRACE ERROR in processAudio:', error);
      logAiStep('Error in processAudio', { error });
      addDebugMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setResponse('Sorry, I had trouble processing that. Please try again.');
    } finally {
      logAiStep('Setting isProcessing to false');
      addDebugMessage('AI processing complete');
      setIsProcessing(false);
    }
  };
  
  /**
   * Process text and handle the result
   */
  const processText = async (text: string) => {
    logAiStep('useAIProcessor.processText called', { text });
    addDebugMessage(`Processing text command: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`);
    
    if (!user?.id) {
      logAiStep('User not authenticated');
      addDebugMessage('Authentication required: User not logged in');
      setResponse('You need to be logged in to use the AI assistant.');
      return;
    }
    
    setIsProcessing(true);
    logAiStep('Set isProcessing to true');
    addDebugMessage('Starting AI processing...');
    
    try {
      // Process with AI service
      logAiStep('About to call handleAIInteraction', {
        userId: user.id,
        textLength: text.length,
        contextData
      });
      addDebugMessage('Sending text to AI service for processing');
      
      const result = await handleAIInteraction({
        userId: user.id,
        content: text,
        interactionType,
        contextData
      });
      
      logAiStep('handleAIInteraction returned', {
        response: result.response,
        commandType: result.processedCommand?.commandType
      });
      addDebugMessage(`AI response received: "${result.response.substring(0, 50)}${result.response.length > 50 ? '...' : ''}"`);
      
      setResponse(result.response);
      setLastCommand(result.processedCommand || null);
      
      // Execute the command if it exists
      if (result.processedCommand) {
        logAiStep('Command found, about to execute', {
          commandType: result.processedCommand.commandType,
          parameters: result.processedCommand.parameters
        });
        addDebugMessage(`Executing command: ${result.processedCommand.commandType}`);
        
        const executionResult = await executeCommand(
          result.processedCommand,
          user.id
        );
        
        logAiStep('Command execution result', {
          success: executionResult.success,
          message: executionResult.message,
          actionType: executionResult.action?.type
        });
        addDebugMessage(`Command execution ${executionResult.success ? 'successful' : 'failed'}`);
        
        setLastResult(executionResult);
        
        // Handle navigation if needed
        if (
          executionResult.action?.type === 'navigate' && 
          executionResult.action.payload?.path
        ) {
          logAiStep('Navigation action detected', {
            path: executionResult.action.payload.path
          });
          addDebugMessage(`Navigating to: ${executionResult.action.payload.path}`);
          
          setTimeout(() => {
            logAiStep('Navigating now');
            router.push(executionResult.action!.payload.path);
          }, 1500);
        }
      } else {
        logAiStep('No command to execute');
        addDebugMessage('No specific command to execute');
      }
    } catch (error) {
      console.error('Error processing text:', error);
      logAiStep('Error in processText', { error });
      addDebugMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
      setResponse('Sorry, I had trouble processing that. Please try again.');
    } finally {
      logAiStep('Setting isProcessing to false');
      addDebugMessage('AI processing complete');
      setIsProcessing(false);
    }
  };
  
  return {
    processAudio,
    processText,
    isProcessing,
    response,
    lastCommand,
    lastResult,
    debugMessages
  };
} 