'use client';

import { useState } from 'react';
import { Box, Typography, Paper, Button, Switch, FormControlLabel } from '@mui/material';
import GolfAssistant from '@/components/ai/GolfAssistant';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Example page for demonstrating the AI debugging features
 */
export default function DebugExamplePage() {
  const { user } = useAuth();
  const [debugEnabled, setDebugEnabled] = useState(true);
  
  // Toggle for the environment variable
  const handleToggleDebug = () => {
    setDebugEnabled(!debugEnabled);
    
    // This just simulates switching the environment variable
    // In a real app, we would actually change the .env value
    if (typeof window !== 'undefined') {
      (window as any).NEXT_PUBLIC_SHOW_AI_STEPS = !debugEnabled ? 'true' : 'false';
    }
  };
  
  return (
    <Box sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        AI Debug Mode Example
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Debug Settings
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={debugEnabled}
              onChange={handleToggleDebug}
              color="primary"
            />
          }
          label="Show AI Processing Steps"
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          When enabled, all AI processing steps will be displayed in toast notifications.
          This helps with debugging voice commands and understanding how the AI processes your requests.
        </Typography>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" fontFamily="monospace" component="div">
            Current environment values:<br />
            NEXT_PUBLIC_SHOW_AI_STEPS: {debugEnabled ? 'true' : 'false'}
          </Typography>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Test Assistant
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Try using the golf assistant below. With debug mode enabled, you&apos;ll see detailed information
          about every step of the AI processing flow.
        </Typography>
        
        {user ? (
          <GolfAssistant 
            contextData={{
              debugMode: debugEnabled
            }}
          />
        ) : (
          <Typography color="error">
            You need to be logged in to use the assistant.
          </Typography>
        )}
      </Paper>
    </Box>
  );
} 