'use client';

import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import VoiceRecorderCore from './core/VoiceRecorderCore';
import { useAIProcessor } from '@/hooks/useAIProcessor';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceRecorderProps {
  /**
   * Action to take when recording is complete and processed
   */
  onProcessed: (response: string, data?: any) => void;
  
  /**
   * Optional context data to send with the interaction
   */
  contextData?: {
    roundId?: string;
    holeNumber?: number;
    courseId?: string;
    [key: string]: any;
  };
  
  /**
   * Optional button label override
   */
  buttonLabel?: string;
  
  /**
   * Optional interaction type (defaults to voice_command)
   */
  interactionType?: 'voice_command' | 'text_command' | 'note' | 'question';
}

/**
 * Voice recorder component with AI processing
 */
export default function VoiceRecorder({
  onProcessed,
  contextData,
  buttonLabel = 'Golf Assistant',
  interactionType = 'voice_command'
}: VoiceRecorderProps) {
  const { profile } = useAuth();
  const [responseText, setResponseText] = useState<string | null>(null);
  
  // Use the AI processor hook to handle all AI logic
  const {
    processAudio,
    isProcessing,
    response
  } = useAIProcessor({
    contextData,
    interactionType
  });
  
  // When response changes, call the onProcessed callback
  useEffect(() => {
    if (response) {
      setResponseText(response);
      onProcessed(response);
    }
  }, [response, onProcessed]);
  
  // Hide response after 5 seconds
  useEffect(() => {
    if (responseText) {
      const timer = setTimeout(() => {
        setResponseText(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [responseText]);
  
  // Check if AI Assistant is disabled in user profile
  const isAssistantDisabled = profile && 'ai_assistant_enabled' in profile && profile.ai_assistant_enabled === false;
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      {isAssistantDisabled ? (
        <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
          AI Assistant is disabled in your profile settings.
        </Typography>
      ) : null}
      
      {/* Show response text if available */}
      {responseText && !isProcessing && (
        <Typography 
          variant="body2" 
          sx={{ 
            p: 2, 
            bgcolor: 'background.paper', 
            borderRadius: 2, 
            boxShadow: 1,
            maxWidth: '100%',
            wordBreak: 'break-word'
          }}
        >
          {responseText}
        </Typography>
      )}
      
      {/* Core recorder that only handles recording */}
      <VoiceRecorderCore
        onRecordingComplete={processAudio}
        isProcessing={isProcessing}
        buttonLabel={buttonLabel}
        disabled={Boolean(isAssistantDisabled)}
      />
    </Box>
  );
} 