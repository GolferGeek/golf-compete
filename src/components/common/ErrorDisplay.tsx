import { Alert, Box } from '@mui/material';

interface ErrorDisplayProps {
  error: string;
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <Box sx={{ p: 2 }}>
      <Alert severity="error">
        {error}
      </Alert>
    </Box>
  );
} 