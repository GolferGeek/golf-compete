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
import { QuickNote, getProfileMetadata, updateQuickNotes } from '@/lib/apiClient/profiles';

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
        
        const metadata = await getProfileMetadata(userId);
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
      
      // Sort notes by creation date (newest first)
      const sortedNotes = updatedNotes.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      await updateQuickNotes(userId, sortedNotes);
      setNotes(sortedNotes);
      
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
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Handle pagination change
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  if (loading && notes.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Quick Notes</Typography>
        {notes.length > 0 && (
          <Button 
            variant="outlined" 
            color="error" 
            size="small"
            onClick={() => setDeleteAllDialogOpen(true)}
          >
            Delete All
          </Button>
        )}
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {notes.length === 0 ? (
        <Typography color="textSecondary" align="center">
          No notes yet
        </Typography>
      ) : (
        <>
          <List>
            {paginatedNotes.map((note) => (
              <ListItem
                key={note.id}
                divider
                sx={{
                  backgroundColor: editingNoteId === note.id ? 'action.hover' : 'inherit',
                }}
              >
                {editingNoteId === note.id ? (
                  <Box width="100%">
                    <TextField
                      fullWidth
                      multiline
                      value={editNoteText}
                      onChange={(e) => setEditNoteText(e.target.value)}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                      <Button
                        size="small"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveEdit}
                        disabled={loading}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        startIcon={<CancelIcon />}
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditNoteText('');
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <>
                    <ListItemText
                      primary={note.note}
                      secondary={formatDate(note.created_at)}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => handleEditNote(note)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => {
                          setNoteToDeleteId(note.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </>
                )}
              </ListItem>
            ))}
          </List>
          
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
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
      
      {/* Delete Note Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this note?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteNote} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete All Notes Dialog */}
      <Dialog
        open={deleteAllDialogOpen}
        onClose={() => setDeleteAllDialogOpen(false)}
      >
        <DialogTitle>Delete All Notes</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete all notes? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAllNotes} color="error" autoFocus>
            Delete All
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
} 