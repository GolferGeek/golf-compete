'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, IconButton, Fab, Button } from '@mui/material';
import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import CloseIcon from '@mui/icons-material/Close';
import BugReportIcon from '@mui/icons-material/BugReport';
import VoiceRecorderCore from './core/VoiceRecorderCore';
import TextCommandInput from './TextCommandInput';
import Toast from './Toast';
import { useAIProcessor } from '@/hooks/useAIProcessor';
import { useAuth } from '@/contexts/AuthContext';
import { isVerboseEnabled } from '@/utils/aiDebug';
import DebugToast from './DebugToast';

interface GolfAssistantProps {
  /**
   * Optional context data to provide contextual information to the AI
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
  
  /**
   * Optional class name for styling
   */
  className?: string;
  
  /**
   * Whether to float the assistant or show inline
   */
  floatingMode?: boolean;
}

/**
 * Combined golf assistant that supports voice and text input with a streamlined UI
 */
export default function GolfAssistant({
  contextData,
  interactionType = 'voice_command',
  className,
  floatingMode = false
}: GolfAssistantProps) {
  const { profile } = useAuth();
  const [inputMode, setInputMode] = useState<'voice' | 'text' | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastAction, setToastAction] = useState<{type: string, description: string} | undefined>(undefined);
  
  // For verbose debug toasts
  const [debugToastOpen, setDebugToastOpen] = useState(false);
  const [debugToastMessage, setDebugToastMessage] = useState('');
  const [debugToastIndex, setDebugToastIndex] = useState(0);
  const [debugToastQueue, setDebugToastQueue] = useState<string[]>([]);
  
  // Use the AI processor hook to handle all AI logic
  const {
    processAudio,
    processText,
    isProcessing,
    response,
    lastResult,
    debugMessages,
    lastCommand
  } = useAIProcessor({
    contextData,
    interactionType
  });
  
  // Handle verbose mode debugs
  const verboseModeEnabled = isVerboseEnabled();
  
  // Process debug messages when they change
  useEffect(() => {
    if (verboseModeEnabled && debugMessages.length > 0) {
      setDebugToastQueue(debugMessages);
      
      if (!debugToastOpen && debugMessages.length > debugToastIndex) {
        setDebugToastMessage(debugMessages[debugToastIndex]);
        setDebugToastOpen(true);
      }
    }
  }, [debugMessages, debugToastIndex, debugToastOpen, verboseModeEnabled]);
  
  // Handle debug toast closing
  useEffect(() => {
    if (!debugToastOpen && debugToastQueue.length > debugToastIndex + 1) {
      // Show the next debug message in queue
      setDebugToastIndex(prev => prev + 1);
      setDebugToastMessage(debugToastQueue[debugToastIndex + 1]);
      setDebugToastOpen(true);
    }
  }, [debugToastOpen, debugToastQueue, debugToastIndex]);
  
  // Reset debug toast state when processing starts
  useEffect(() => {
    if (isProcessing) {
      setDebugToastQueue([]);
      setDebugToastIndex(0);
      setDebugToastOpen(false);
    }
  }, [isProcessing]);
  
  // Update toast when response changes
  useEffect(() => {
    if (response) {
      setToastMessage(response);
      
      // Set toast action if it exists
      if (lastResult?.action?.type === 'navigate') {
        setToastAction({
          type: 'Navigating to',
          description: lastResult.action.payload?.path || ''
        });
      } else {
        setToastAction(undefined);
      }
      
      setToastOpen(true);
      setError(null);  // Clear any previous errors
    }
  }, [response, lastResult]);
  
  // Check if AI Assistant is disabled in user profile
  const isAssistantDisabled = profile && 'ai_assistant_enabled' in profile && profile.ai_assistant_enabled === false;
  
  // Convert to boolean for MUI components
  const isDisabled = Boolean(isAssistantDisabled);
  
  // Handle audio recording complete
  const handleAudioComplete = (audioBlob: Blob) => {
    try {
      // Reset UI to clean state
      setInputMode(null);
      
      processAudio(audioBlob).catch(err => {
        console.error('Error in processAudio:', err);
        setError(`Error processing audio: ${err.message}`);
        setToastOpen(false);
      });
    } catch (err) {
      console.error('Error calling processAudio:', err);
      setError(`Error calling processAudio: ${err instanceof Error ? err.message : String(err)}`);
      setToastOpen(false);
    }
  };
  
  // Handle text submission
  const handleTextSubmit = (text: string) => {
    try {
      // Reset UI to clean state
      setInputMode(null);
      
      processText(text).catch(err => {
        console.error('Error in processText:', err);
        setError(`Error processing text: ${err.message}`);
        setToastOpen(false);
      });
    } catch (err) {
      console.error('Error calling processText:', err);
      setError(`Error calling processText: ${err instanceof Error ? err.message : String(err)}`);
      setToastOpen(false);
    }
  };
  
  // Toggle debug info
  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };
  
  // Skip remaining debug toasts
  const skipRemainingDebugToasts = () => {
    setDebugToastIndex(debugToastQueue.length);
    setDebugToastOpen(false);
  };
  
  // Handle debug toast navigation
  const handleNextStep = useCallback(() => {
    if (debugToastIndex < debugToastQueue.length - 1) {
      setDebugToastOpen(false);
      setTimeout(() => {
        setDebugToastIndex(prev => prev + 1);
        setDebugToastMessage(debugToastQueue[debugToastIndex + 1]);
        setDebugToastOpen(true);
      }, 300);
    }
  }, [debugToastIndex, debugToastQueue]);

  const handlePreviousStep = useCallback(() => {
    if (debugToastIndex > 0) {
      setDebugToastOpen(false);
      setTimeout(() => {
        setDebugToastIndex(prev => prev - 1);
        setDebugToastMessage(debugToastQueue[debugToastIndex - 1]);
        setDebugToastOpen(true);
      }, 300);
    }
  }, [debugToastIndex, debugToastQueue]);
  
  // For floating mode, just show the FAB until clicked
  if (floatingMode && inputMode === null) {
    return (
      <>
        <Fab
          color="primary"
          size="medium"
          onClick={() => setInputMode('voice')}
          disabled={isDisabled}
          sx={{ 
            position: 'fixed',
            bottom: 80,
            right: 16,
            boxShadow: 3
          }}
        >
          <KeyboardVoiceIcon fontSize="small" />
        </Fab>
        
        {/* Main toast notification */}
        <Toast
          message={toastMessage}
          action={toastAction}
          open={toastOpen}
          onClose={() => setToastOpen(false)}
          type={error ? 'error' : 'success'}
        />
        
        {/* Debug step toast notification */}
        {verboseModeEnabled && (
          <DebugToast
            message={debugToastMessage}
            step={debugToastIndex + 1}
            totalSteps={debugToastQueue.length}
            open={debugToastOpen}
            onClose={() => setDebugToastOpen(false)}
            onNext={handleNextStep}
            onPrevious={handlePreviousStep}
            onSkipAll={skipRemainingDebugToasts}
          />
        )}
      </>
    );
  }
  
  // Standard mode or floating mode with input active
  return (
    <>
      <Paper 
        elevation={3} 
        className={className}
        sx={{ 
          p: 2,
          borderRadius: 3,
          width: '100%',
          maxWidth: floatingMode ? '95vw' : 500,
          position: floatingMode ? 'fixed' : 'relative',
          bottom: floatingMode ? 80 : 'auto',
          right: floatingMode ? 16 : 'auto',
          zIndex: floatingMode ? 999 : 'auto',
        }}
      >
        {/* Header with mode toggles */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Golf Assistant
            <IconButton size="small" onClick={toggleDebug} sx={{ ml: 1 }}>
              <BugReportIcon fontSize="small" />
            </IconButton>
          </Typography>
          
          <Box>
            {inputMode !== 'voice' && (
              <IconButton 
                color="primary"
                onClick={() => setInputMode('voice')}
                disabled={isDisabled}
              >
                <KeyboardVoiceIcon />
              </IconButton>
            )}
            
            {inputMode !== 'text' && (
              <IconButton 
                color="primary"
                onClick={() => setInputMode('text')}
                disabled={isDisabled}
              >
                <KeyboardIcon />
              </IconButton>
            )}
            
            {floatingMode && (
              <IconButton onClick={() => setInputMode(null)}>
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        </Box>
        
        {/* Status message */}
        {isAssistantDisabled && (
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            AI Assistant is disabled in your profile settings.
          </Typography>
        )}
        
        {/* Verbose mode indicator */}
        {verboseModeEnabled && (
          <Typography 
            color="info.main" 
            variant="body2" 
            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <BugReportIcon fontSize="small" /> AI verbose mode enabled
            {debugToastQueue.length > 0 && (
              <Button 
                size="small" 
                variant="outlined" 
                color="info" 
                onClick={skipRemainingDebugToasts}
              >
                Skip Steps ({debugToastIndex}/{debugToastQueue.length})
              </Button>
            )}
          </Typography>
        )}
        
        {/* Debug info */}
        {showDebug && (
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: 'grey.100',
              borderRadius: 2, 
              mb: 2,
              maxHeight: '200px',
              overflowY: 'auto',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}
          >
            <Typography variant="caption" fontWeight="bold">Debug Info:</Typography>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {JSON.stringify({
                contextData,
                interactionType,
                inputMode,
                isProcessing,
                response,
                lastCommand: lastCommand ? {
                  type: lastCommand.commandType,
                  params: lastCommand.parameters
                } : null,
                lastResult: lastResult ? {
                  success: lastResult.success,
                  action: lastResult.action
                } : null,
                debugMessages: debugMessages.slice(-5) // Show last 5 messages
              }, null, 2)}
            </pre>
          </Box>
        )}
        
        {/* Voice input interface */}
        {inputMode === 'voice' && (
          <Box sx={{ my: 2 }}>
            <VoiceRecorderCore
              onRecordingComplete={handleAudioComplete}
              isProcessing={isProcessing}
              toggleMode={true}
            />
          </Box>
        )}
        
        {/* Text input interface */}
        {inputMode === 'text' && (
          <Box sx={{ my: 2 }}>
            <TextCommandInput 
              onSubmit={handleTextSubmit}
              isProcessing={isProcessing}
            />
          </Box>
        )}
        
        {/* Status message */}
        {isProcessing && (
          <Typography color="text.secondary" variant="body2" sx={{ mt: 2 }}>
            Processing your request...
          </Typography>
        )}
      </Paper>
      
      {/* Main toast notification */}
      <Toast
        message={toastMessage}
        action={toastAction}
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        type={error ? 'error' : 'success'}
      />
      
      {/* Debug step toast notification */}
      {verboseModeEnabled && (
        <DebugToast
          message={debugToastMessage}
          step={debugToastIndex + 1}
          totalSteps={debugToastQueue.length}
          open={debugToastOpen}
          onClose={() => setDebugToastOpen(false)}
          onNext={handleNextStep}
          onPrevious={handlePreviousStep}
          onSkipAll={skipRemainingDebugToasts}
        />
      )}
    </>
  );
} 