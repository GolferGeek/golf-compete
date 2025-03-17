'use client';

import { useState, useEffect } from 'react';
import { Box, Paper, Typography, IconButton, Slide, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BugReportIcon from '@mui/icons-material/BugReport';
import SouthIcon from '@mui/icons-material/South';
import NorthIcon from '@mui/icons-material/North';

interface DebugToastProps {
  /**
   * Debug message to display
   */
  message: string;
  
  /**
   * Current step number
   */
  step: number;
  
  /**
   * Total steps
   */
  totalSteps: number;
  
  /**
   * Whether the toast is open
   */
  open: boolean;
  
  /**
   * Callback for closing the toast
   */
  onClose: () => void;
  
  /**
   * Callback for showing the next step
   */
  onNext?: () => void;
  
  /**
   * Callback for showing the previous step
   */
  onPrevious?: () => void;
  
  /**
   * Callback for skipping all steps
   */
  onSkipAll?: () => void;
}

/**
 * A toast specifically designed for showing AI debugging steps
 * Shows more technical details and includes navigation controls
 */
export default function DebugToast({
  message,
  step,
  totalSteps,
  open,
  onClose,
  onNext,
  onPrevious,
  onSkipAll
}: DebugToastProps) {
  const [isVisible, setIsVisible] = useState(open);
  
  // Handle visibility changes
  useEffect(() => {
    setIsVisible(open);
  }, [open]);
  
  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };
  
  // Auto-close only after a longer duration for debugging
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (open) {
      timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, 5000); // Longer duration for debug toasts
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open, onClose]);
  
  const hasPrevious = step > 1;
  const hasNext = step < totalSteps;
  
  return (
    <Slide direction="up" in={isVisible} mountOnEnter unmountOnExit>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 80, // Position above the regular toast
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: 'calc(100% - 32px)',
          width: 'auto',
          minWidth: 300,
          bgcolor: '#f0f8ff', // Light blue for debugging
          borderRadius: 4,
          zIndex: 9999,
          overflow: 'hidden',
          border: '1px solid #a0d2eb',
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 1, 
          display: 'flex', 
          alignItems: 'center',
          bgcolor: '#e0f0ff',
          borderBottom: '1px solid #a0d2eb'
        }}>
          <BugReportIcon color="info" sx={{ mr: 1 }} />
          <Typography variant="subtitle2" sx={{ flex: 1 }}>
            AI Debug Step {step}/{totalSteps}
          </Typography>
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ ml: 1 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {/* Message content */}
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {message}
          </Typography>
        </Box>
        
        {/* Navigation controls */}
        <Box sx={{ 
          p: 1, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid #a0d2eb',
          bgcolor: '#e0f0ff',
        }}>
          <Box>
            <Button 
              size="small"
              disabled={!hasPrevious}
              onClick={onPrevious}
              startIcon={<NorthIcon />}
              sx={{ mr: 1 }}
            >
              Prev
            </Button>
            <Button 
              size="small"
              disabled={!hasNext}
              onClick={onNext}
              endIcon={<SouthIcon />}
            >
              Next
            </Button>
          </Box>
          
          <Button 
            size="small"
            variant="outlined"
            onClick={onSkipAll}
            color="info"
          >
            Skip All
          </Button>
        </Box>
      </Paper>
    </Slide>
  );
} 