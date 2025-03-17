'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  FormControlLabel, 
  Switch, 
  TextField, 
  InputAdornment, 
  IconButton,
  Collapse,
  Alert
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

interface OpenAiKeyFieldProps {
  openAiKey?: string;
  useOwnKey?: boolean;
  aiAssistantEnabled?: boolean;
  onOpenAiKeyChange: (value: string) => void;
  onUseOwnKeyChange: (value: boolean) => void;
  onAiAssistantEnabledChange: (value: boolean) => void;
}

/**
 * A form control for OpenAI API key settings
 * This component can be directly integrated into a profile form
 */
export default function OpenAiKeyField({
  openAiKey = '',
  useOwnKey = false,
  aiAssistantEnabled = true,
  onOpenAiKeyChange,
  onUseOwnKeyChange,
  onAiAssistantEnabledChange
}: OpenAiKeyFieldProps) {
  const [showApiKey, setShowApiKey] = useState(false);
  
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        AI Assistant Settings
      </Typography>
      
      <FormControlLabel
        control={
          <Switch
            checked={aiAssistantEnabled}
            onChange={(e) => onAiAssistantEnabledChange(e.target.checked)}
            name="aiAssistantEnabled"
            color="primary"
          />
        }
        label="Enable AI Assistant"
        sx={{ display: 'block', mb: 2 }}
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={useOwnKey}
            onChange={(e) => onUseOwnKeyChange(e.target.checked)}
            name="useOwnOpenAiKey"
            color="primary"
            disabled={!aiAssistantEnabled}
          />
        }
        label="Use my own OpenAI API key"
        sx={{ display: 'block', mb: 2 }}
      />
      
      <Collapse in={useOwnKey && aiAssistantEnabled}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Your OpenAI API Key"
            variant="outlined"
            value={openAiKey}
            onChange={(e) => onOpenAiKeyChange(e.target.value)}
            type={showApiKey ? 'text' : 'password'}
            placeholder="sk-..."
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle api key visibility"
                    onClick={() => setShowApiKey(!showApiKey)}
                    edge="end"
                  >
                    {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Using your own API key allows for faster processing and ensures you have full control over usage.
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Your API key is stored securely and is only used for your own interactions with the AI assistant.
              You can get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI's website</a>.
            </Typography>
          </Alert>
        </Box>
      </Collapse>
    </Box>
  );
} 