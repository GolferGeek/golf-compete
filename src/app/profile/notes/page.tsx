'use client';

import { Container, Box, Typography } from '@mui/material';
import NotesListView from '@/components/notes/NotesListView';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Golf Notes Page
 * Allows users to view and manage all their golf notes in one place
 */
export default function GolfNotesPage() {
  const { user } = useAuth();
  
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
        <Typography variant="h4" gutterBottom>
          Golf Notes
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all your golf notes in one place. Use the filters and search to find specific notes.
        </Typography>
      </Box>
      
      <NotesListView 
        userId={user.id} 
        showCreateButton={true}
        maxHeight="calc(100vh - 200px)"
      />
    </Container>
  );
} 