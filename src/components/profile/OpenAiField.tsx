'use client';

import { useState } from 'react';
import { 
  Box, 
  FormControlLabel, 
  Switch, 
  TextField, 
  InputAdornment, 
  IconButton,
  Collapse,
  Typography,
  Alert
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

/**
 * A simple field for OpenAI API key that can be added to an existing profile form
 */
export default function OpenAiField({ 
  openAiKey = '', 
  useOwnKey = false,
  aiEnabled = true,
  onChange = () => {},
  id = 'openai-api-key'
}: {
  openAiKey?: string;
  useOwnKey?: boolean;
  aiEnabled?: boolean;
  onChange?: (values: { field: string, value: string | boolean }) => void;
  id?: string;
}) {
  const [showApiKey, setShowApiKey] = useState(false);
  
  const handleOpenAiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ field: 'openai_api_key', value: e.target.value });
  };
  
  const handleUseOwnKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ field: 'use_own_openai_key', value: e.target.checked });
  };
  
  const handleAiEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ field: 'ai_assistant_enabled', value: e.target.checked });
  };
  
  return (
    <Box>
      <Typography variant="subtitle1" gutterBottom fontWeight="medium">
        AI Assistant Settings
      </Typography>
      
      <Box sx={{ ml: 0.5 }}>
        <FormControlLabel
          control={
            <Switch
              checked={aiEnabled}
              onChange={handleAiEnabledChange}
              name="ai_assistant_enabled"
              color="primary"
            />
          }
          label="Enable AI Golf Assistant"
          sx={{ display: 'block', mb: 2 }}
        />
        
        <FormControlLabel
          control={
            <Switch
              checked={useOwnKey}
              onChange={handleUseOwnKeyChange}
              name="use_own_openai_key"
              color="primary"
              disabled={!aiEnabled}
            />
          }
          label="Use my own OpenAI API key"
          sx={{ display: 'block', mb: 2 }}
        />
        
        <Collapse in={useOwnKey && aiEnabled}>
          <TextField
            fullWidth
            id={id}
            label="Your OpenAI API Key"
            variant="outlined"
            value={openAiKey}
            onChange={handleOpenAiKeyChange}
            type={showApiKey ? 'text' : 'password'}
            placeholder="sk-..."
            autoComplete="off"
            sx={{ mb: 1 }}
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
          
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Using your own API key provides faster processing on the golf course.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 2 }} variant="outlined">
            <Typography variant="body2">
              Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI's website</a>
            </Typography>
          </Alert>
        </Collapse>
      </Box>
    </Box>
  );
} 