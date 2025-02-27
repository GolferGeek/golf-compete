'use client';

import * as React from 'react';
import { 
  Card as MuiCard, 
  CardProps as MuiCardProps,
  CardContent as MuiCardContent,
  CardContentProps as MuiCardContentProps,
  CardHeader as MuiCardHeader,
  CardHeaderProps as MuiCardHeaderProps,
  CardActions as MuiCardActions,
  CardActionsProps as MuiCardActionsProps,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled components
const StyledCard = styled(MuiCard)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
}));

// Export components
export const Card = React.forwardRef<HTMLDivElement, MuiCardProps>(
  (props, ref) => <StyledCard ref={ref} {...props} />
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, MuiCardHeaderProps>(
  (props, ref) => <MuiCardHeader ref={ref} {...props} />
);
CardHeader.displayName = 'CardHeader';

export const CardContent = React.forwardRef<HTMLDivElement, MuiCardContentProps>(
  (props, ref) => <MuiCardContent ref={ref} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, MuiCardActionsProps>(
  (props, ref) => <MuiCardActions ref={ref} {...props} />
);
CardFooter.displayName = 'CardFooter';

// Additional components
export interface CardTitleProps {
  children?: React.ReactNode;
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, ...props }, ref) => (
    <Typography variant="h6" component="h3" ref={ref} {...props}>
      {children}
    </Typography>
  )
);
CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps {
  children?: React.ReactNode;
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ children, ...props }, ref) => (
    <Typography 
      variant="body2" 
      color="text.secondary" 
      ref={ref} 
      {...props}
    >
      {children}
    </Typography>
  )
);
CardDescription.displayName = 'CardDescription';
