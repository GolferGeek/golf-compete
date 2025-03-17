'use client';

import { useState } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import UserNotesManager from '@/components/notes/UserNotesManager';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Golf Notes Page
 * Allows users to view and manage all their golf notes in one place
 */
export default function GolfNotesPage() {
  const { user } = useAuth();
  const [notesUpdated, setNotesUpdated] = useState(0);
  
  const handleNotesUpdated = () => {
    setNotesUpdated(prev => prev + 1);
  };
  
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Golf Notes
        </Typography>
        <Typography>
          Please log in to view and manage your notes.
        </Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Golf Notes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all your golf notes in one place. This includes notes from specific rounds and holes, 
          as well as general notes you've created. Use the filters and search to find specific notes.
        </Typography>
      </Box>
      
      <UserNotesManager 
        userId={user.id} 
        onNotesUpdated={handleNotesUpdated} 
      />
      
      <Box sx={{ mt: 2 }}>
        <Button 
          variant="outlined" 
          href="/profile"
        >
          Back to Profile
        </Button>
      </Box>
    </Container>
  );
} 