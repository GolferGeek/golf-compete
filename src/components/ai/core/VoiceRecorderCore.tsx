'use client';

import { useState, useRef, useEffect } from 'react';
import { Box, Button, CircularProgress, Typography, useTheme } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import { motion } from 'framer-motion';

// Speech recognition types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal?: boolean;
  length: number;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Simplified speech recognition wrapper
const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  
  const start = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log('Speech recognition error:', e);
    }
  };
  
  const stop = () => {
    if (!recognitionRef.current) return;
    
    try {
      recognitionRef.current.stop();
    } catch (e) {
      console.log('Speech recognition error:', e);
    }
  };
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // @ts-ignore - Browser compatibility
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.log('Speech recognition not supported');
      return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        finalTranscript += result[0]?.transcript || '';
      }
      
      setTranscript(finalTranscript);
    };
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);
  
  return { transcript, start, stop };
};

interface VoiceRecorderCoreProps {
  /**
   * Called when audio recording is complete
   */
  onRecordingComplete: (audioBlob: Blob) => void;
  
  /**
   * Called when recording is canceled or errors
   */
  onError?: (error: Error) => void;
  
  /**
   * Is the system busy processing?
   */
  isProcessing?: boolean;
  
  /**
   * Button label
   */
  buttonLabel?: string;
  
  /**
   * Is the recorder disabled?
   */
  disabled?: boolean;
  
  /**
   * Use toggle mode instead of press-and-hold (better for desktop)
   */
  toggleMode?: boolean;
}

/**
 * Core voice recorder component that handles audio recording with press-and-hold pattern
 */
export default function VoiceRecorderCore({
  onRecordingComplete,
  onError,
  isProcessing = false,
  buttonLabel = 'Hold to speak',
  disabled = false,
  toggleMode = true // Default to toggle mode for easier desktop testing
}: VoiceRecorderCoreProps) {
  const theme = useTheme();
  const [isRecording, setIsRecording] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const { transcript, start: startSpeechRecognition, stop: stopSpeechRecognition } = useSpeechRecognition();
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Handle click for toggle mode
  const handleClick = () => {
    if (!toggleMode || isProcessing || disabled) return;
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const startRecording = async () => {
    console.log('🎙️ TRACE: Starting recording...');
    
    try {
      // Request microphone access
      console.log('🎙️ TRACE: Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('🎙️ TRACE: Microphone access granted');
      streamRef.current = stream;
      
      // Create and configure media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Set up data handling
      mediaRecorder.ondataavailable = (event) => {
        console.log(`🎙️ TRACE: Audio data available, size: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Start recording
      console.log('🎙️ TRACE: Media recorder starting...');
      mediaRecorder.start();
      setIsRecording(true);
      setPermissionDenied(false);
      
      // Start speech recognition
      startSpeechRecognition();
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('❌ TRACE ERROR: Error accessing microphone:', error);
      setPermissionDenied(true);
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };
  
  // Process the audio on stop
  const processAudio = () => {
    // Process the audio
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    console.log(`🎙️ TRACE: Audio blob created, size: ${audioBlob.size} bytes`);
    
    try {
      // Call the callback with the audio blob
      console.log('🎙️ TRACE: About to call onRecordingComplete callback');
      onRecordingComplete(audioBlob);
      console.log('🎙️ TRACE: Successfully called onRecordingComplete callback');
    } catch (error) {
      console.error('❌ TRACE ERROR: Error in onRecordingComplete:', error);
      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };
  
  const stopRecording = () => {
    console.log('🎙️ TRACE: Stop recording requested');
    
    // Stop speech recognition
    stopSpeechRecognition();
    
    if (mediaRecorderRef.current && isRecording) {
      console.log('🎙️ TRACE: Stopping media recorder');
      mediaRecorderRef.current.stop();
      
      // Process the audio when the recorder stops
      mediaRecorderRef.current.onstop = async () => {
        console.log('🎙️ TRACE: Recording stopped, processing audio...');
        setIsRecording(false);
        
        processAudio();
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    setRecordingTime(0);
  };
  
  // Format recording time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
      {permissionDenied ? (
        <Typography color="error" variant="body2" sx={{ mb: 1 }}>
          Microphone access was denied. Please enable it in your browser settings.
        </Typography>
      ) : null}
      
      <Box sx={{ position: 'relative' }}>
        <Button
          variant="contained"
          color={isRecording ? "secondary" : "primary"}
          onClick={toggleMode ? handleClick : undefined}
          onMouseDown={!toggleMode && !isProcessing && !disabled ? startRecording : undefined}
          onMouseUp={!toggleMode && !isProcessing && !disabled ? stopRecording : undefined}
          onMouseLeave={!toggleMode && isRecording ? stopRecording : undefined}
          onTouchStart={!toggleMode && !isProcessing && !disabled ? startRecording : undefined}
          onTouchEnd={!toggleMode && !isProcessing && !disabled ? stopRecording : undefined}
          disabled={isProcessing || disabled}
          sx={{
            borderRadius: '24px',
            p: 2,
            minWidth: 0,
            width: 56,
            height: 56,
            boxShadow: 2,
            transition: 'all 0.3s ease',
          }}
        >
          {isProcessing ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <MicIcon />
          )}
        </Button>
        
        {isRecording && (
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '50%', 
              border: `2px solid ${theme.palette.secondary.main}`,
              opacity: 0.7,
              pointerEvents: 'none'
            }}
          />
        )}
      </Box>
      
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {isRecording && (
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Recording... {formatTime(recordingTime)}
              {toggleMode && <span> (Click again to stop)</span>}
            </Typography>
            <Typography variant="body2" sx={{ fontStyle: 'italic', maxHeight: 60, overflow: 'auto' }}>
              {transcript || 'Listening...'}
            </Typography>
          </Box>
        )}
        
        {!isRecording && !isProcessing && (
          <Typography variant="body2" color="text.secondary">
            {toggleMode ? 'Click to start recording' : buttonLabel}
          </Typography>
        )}
        
        {isProcessing && (
          <Typography variant="body2" color="text.secondary">
            Processing...
          </Typography>
        )}
      </Box>
    </Box>
  );
} 