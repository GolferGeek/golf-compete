'use client';

import * as React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { styled } from '@mui/material/styles';

// Extend the MUI Button props with our custom variants if needed
export type ButtonProps = MuiButtonProps;

// Create a styled version of MUI Button with our custom styles
const StyledButton = styled(MuiButton)<ButtonProps>(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  textTransform: 'none',
  fontWeight: 500,
  boxShadow: 'none',
  '&.MuiButton-sizeLarge': {
    padding: theme.spacing(1.5, 3),
    fontSize: '1rem',
  },
  '&.MuiButton-sizeSmall': {
    padding: theme.spacing(0.5, 1.5),
    fontSize: '0.875rem',
  },
}));

// Export our custom Button component
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <StyledButton ref={ref} {...props}>
        {children}
      </StyledButton>
    );
  }
);

Button.displayName = 'Button';
