'use client';

import { useState } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  InputAdornment,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

interface TextCommandInputProps {
  /**
   * Called when text is submitted
   */
  onSubmit: (text: string) => void;
  
  /**
   * Is the system busy processing?
   */
  isProcessing?: boolean;
  
  /**
   * Placeholder text
   */
  placeholder?: string;
  
  /**
   * Is the input disabled?
   */
  disabled?: boolean;
}

/**
 * Text input component for the AI assistant
 */
export default function TextCommandInput({
  onSubmit,
  isProcessing = false,
  placeholder = 'Type a command or question...',
  disabled = false
}: TextCommandInputProps) {
  const [text, setText] = useState('');
  
  const handleSubmit = () => {
    if (text.trim() && !isProcessing) {
      onSubmit(text.trim());
      setText('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <Box sx={{ width: '100%', maxWidth: 500 }}>
      <TextField
        fullWidth
        variant="outlined"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isProcessing || disabled}
        size="small"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton 
                edge="end" 
                onClick={handleSubmit}
                disabled={!text.trim() || isProcessing || disabled}
                color="primary"
              >
                {isProcessing ? (
                  <CircularProgress size={20} />
                ) : (
                  <SendIcon />
                )}
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '24px',
            backgroundColor: 'background.paper',
          }
        }}
      />
    </Box>
  );
} 