'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Button, 
  Divider, 
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  Alert,
  Pagination
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
interface QuickNote {
  id: string;
  note: string;
  category: string;
  created_at: string;
}

interface ProfileMetadata {
  quick_notes?: QuickNote[];
  [key: string]: any;
}

interface QuickNotesManagerProps {
  userId: string;
  onNotesUpdated?: () => void;
}

/**
 * Component for managing quick notes stored in profile metadata
 */
export default function QuickNotesManager({ userId, onNotesUpdated }: QuickNotesManagerProps) {
  // State for notes and UI
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const notesPerPage = 10;
  const totalPages = Math.ceil(notes.length / notesPerPage);
  const paginatedNotes = notes.slice((page - 1) * notesPerPage, page * notesPerPage);
  
  // Load notes from profile
  useEffect(() => {
    async function loadNotes() {
      try {
        setLoading(true);
        setError(null);
        
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('metadata')
          .eq('id', userId)
          .single();
        
        if (error) {
          throw error;
        }
        
        const metadata = profile?.metadata as ProfileMetadata || {};
        const quickNotes = metadata.quick_notes || [];
        
        // Sort notes by creation date (newest first)
        setNotes(quickNotes.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ));
      } catch (err) {
        console.error('Error loading notes:', err);
        setError('Failed to load notes. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    if (userId) {
      loadNotes();
    }
  }, [userId]);
  
  // Update profile metadata with new notes
  const updateProfileMetadata = async (updatedNotes: QuickNote[]) => {
    try {
      setLoading(true);
      
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('metadata')
        .eq('id', userId)
        .single();
      
      if (fetchError) {
        throw fetchError;
      }
      
      const metadata = {...(profile?.metadata || {})} as ProfileMetadata;
      metadata.quick_notes = updatedNotes;
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ metadata })
        .eq('id', userId);
      
      if (updateError) {
        throw updateError;
      }
      
      setNotes(updatedNotes.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      
      if (onNotesUpdated) {
        onNotesUpdated();
      }
      
      return true;
    } catch (err) {
      console.error('Error updating notes:', err);
      setError('Failed to update notes. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a note
  const handleDeleteNote = async () => {
    if (!noteToDeleteId) return;
    
    const updatedNotes = notes.filter(note => note.id !== noteToDeleteId);
    const success = await updateProfileMetadata(updatedNotes);
    
    if (success) {
      setDeleteDialogOpen(false);
      setNoteToDeleteId(null);
    }
  };
  
  // Delete all notes
  const handleDeleteAllNotes = async () => {
    const success = await updateProfileMetadata([]);
    
    if (success) {
      setDeleteAllDialogOpen(false);
      setPage(1);
    }
  };
  
  // Edit a note
  const handleEditNote = (note: QuickNote) => {
    setEditingNoteId(note.id);
    setEditNoteText(note.note);
  };
  
  // Save edited note
  const handleSaveEdit = async () => {
    if (!editingNoteId) return;
    
    const updatedNotes = notes.map(note => 
      note.id === editingNoteId 
        ? { ...note, note: editNoteText, updated_at: new Date().toISOString() } 
        : note
    );
    
    const success = await updateProfileMetadata(updatedNotes);
    
    if (success) {
      setEditingNoteId(null);
      setEditNoteText('');
    }
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Handle page change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  if (loading && notes.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h6">Quick Notes</Typography>
        
        <Box>
          {notes.length > 0 && (
            <Button 
              color="error" 
              size="small" 
              onClick={() => setDeleteAllDialogOpen(true)}
              startIcon={<DeleteIcon />}
            >
              Delete All
            </Button>
          )}
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {notes.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No quick notes yet. Use the Golf Assistant to add notes without a specific round.
        </Typography>
      ) : (
        <>
          <List sx={{ width: '100%' }}>
            {paginatedNotes.map((note, index) => (
              <Box key={note.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  alignItems="flex-start"
                  secondaryAction={
                    editingNoteId === note.id ? (
                      <>
                        <IconButton edge="end" onClick={handleSaveEdit} title="Save">
                          <SaveIcon color="primary" />
                        </IconButton>
                        <IconButton edge="end" onClick={() => setEditingNoteId(null)} title="Cancel">
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton 
                          edge="end" 
                          onClick={() => handleEditNote(note)} 
                          title="Edit"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          onClick={() => {
                            setNoteToDeleteId(note.id);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )
                  }
                >
                  <ListItemText
                    primary={
                      editingNoteId === note.id ? (
                        <TextField
                          fullWidth
                          multiline
                          value={editNoteText}
                          onChange={(e) => setEditNoteText(e.target.value)}
                          variant="outlined"
                          size="small"
                          autoFocus
                        />
                      ) : (
                        note.note
                      )
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.secondary"
                        >
                          {formatDate(note.created_at)}
                        </Typography>
                        {note.category && (
                          <Chip 
                            label={note.category} 
                            size="small" 
                            sx={{ ml: 1 }} 
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={totalPages} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          )}
        </>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this note? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteNote} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete All Confirmation Dialog */}
      <Dialog
        open={deleteAllDialogOpen}
        onClose={() => setDeleteAllDialogOpen(false)}
      >
        <DialogTitle>Delete All Notes</DialogTitle>
        <DialogContent>
          Are you sure you want to delete all your quick notes? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAllNotes} color="error">Delete All</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
} 