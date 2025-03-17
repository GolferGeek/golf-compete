'use client';

import { useState, useEffect, ReactNode } from 'react';
import { Box, Paper, Typography, IconButton, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';

interface ToastProps {
  /**
   * Message to display
   */
  message: string;
  
  /**
   * Optional action data to display
   */
  action?: {
    type: string;
    description: string;
  };
  
  /**
   * Optional toast type
   */
  type?: 'success' | 'info' | 'error';
  
  /**
   * Time in ms to display the toast (0 for no auto-hide)
   */
  duration?: number;
  
  /**
   * Optional callback when toast is closed
   */
  onClose?: () => void;
  
  /**
   * Whether the toast is open
   */
  open: boolean;
}

/**
 * Toast notification component for displaying temporary messages
 */
export default function Toast({
  message,
  action,
  type = 'info',
  duration = 5000,
  onClose,
  open
}: ToastProps) {
  const [isVisible, setIsVisible] = useState(open);
  
  useEffect(() => {
    setIsVisible(open);
    
    // Auto-hide after duration (if duration > 0)
    let timer: NodeJS.Timeout | null = null;
    if (open && duration > 0) {
      timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open, duration, onClose]);
  
  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };
  
  // Map type to icon and color
  const getIcon = (): ReactNode => {
    switch (type) {
      case 'success':
        return <CheckIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'info':
      default:
        return <InfoIcon color="info" />;
    }
  };
  
  const getBgColor = (): string => {
    switch (type) {
      case 'success':
        return '#e6f7e6';
      case 'error':
        return '#fde9e9';
      case 'info':
      default:
        return '#e8f0fe';
    }
  };
  
  return (
    <Slide direction="up" in={isVisible} mountOnEnter unmountOnExit>
      <Paper
        elevation={3}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: 'calc(100% - 32px)',
          width: 'auto',
          bgcolor: getBgColor(),
          borderRadius: 4,
          zIndex: 9999,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start' }}>
          <Box sx={{ mr: 2, mt: 0.5 }}>{getIcon()}</Box>
          
          <Box sx={{ flex: 1, pr: 2 }}>
            <Typography variant="body1">{message}</Typography>
            
            {action && (
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 0.5, 
                  color: 'text.secondary',
                  fontWeight: 'medium'
                }}
              >
                {action.type}: {action.description}
              </Typography>
            )}
          </Box>
          
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{ mt: -0.5, mr: -0.5 }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Slide>
  );
} 