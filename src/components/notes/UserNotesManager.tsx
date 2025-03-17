'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
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
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  SelectChangeEvent,
  ListItemIcon,
  InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import FlagIcon from '@mui/icons-material/Flag';
import NoteIcon from '@mui/icons-material/Note';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
interface UserNote {
  id: string;
  profile_id: string;
  note_text: string;
  category: string;
  round_id: string | null;
  hole_number: number | null;
  created_at: string;
  updated_at: string | null;
  tags: string[];
  metadata: Record<string, any>;
  
  // Joined data
  round_date?: string;
  course_name?: string;
}

interface UserNotesManagerProps {
  userId: string;
  roundId?: string;
  holeNumber?: number;
  onNotesUpdated?: () => void;
  maxHeight?: string | number;
}

/**
 * Component for managing all user notes
 */
export default function UserNotesManager({ 
  userId, 
  roundId,
  holeNumber,
  onNotesUpdated,
  maxHeight
}: UserNotesManagerProps) {
  // State for notes and UI
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Pagination
  const [page, setPage] = useState(1);
  const notesPerPage = 10;
  
  const router = useRouter();
  
  // Load notes from database
  useEffect(() => {
    loadNotes();
  }, [userId, roundId, holeNumber, categoryFilter, sortOrder, searchTerm]);
  
  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [categoryFilter, sortOrder, searchTerm]);
  
  // Load notes from unified user_notes table
  async function loadNotes() {
    try {
      setLoading(true);
      setError(null);
      
      // Build the query
      let query = supabase
        .from('user_notes')
        .select(`
          *,
          rounds:round_id (
            date,
            courses:course_id (
              name
            )
          )
        `)
        .eq('profile_id', userId);
      
      // Apply roundId filter if provided
      if (roundId) {
        query = query.eq('round_id', roundId);
      }
      
      // Apply holeNumber filter if provided
      if (holeNumber) {
        query = query.eq('hole_number', holeNumber);
      }
      
      // Apply category filter if selected
      if (categoryFilter.length > 0) {
        query = query.in('category', categoryFilter);
      }
      
      // Apply search filter if provided
      if (searchTerm) {
        query = query.ilike('note_text', `%${searchTerm}%`);
      }
      
      // Apply sort order
      if (sortOrder === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('created_at', { ascending: true });
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Process and enhance the data
      const processedNotes = data?.map(note => {
        const round = note.rounds as any;
        return {
          ...note,
          round_date: round?.date,
          course_name: round?.courses?.name
        };
      }) || [];
      
      setNotes(processedNotes);
      
      // Extract available categories for the filter
      const categories = Array.from(new Set(processedNotes.map(note => note.category)))
        .filter(Boolean) as string[];
      setAvailableCategories(categories);
      
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  
  // Compute filtered notes
  const filteredNotes = notes;
  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);
  const paginatedNotes = filteredNotes.slice((page - 1) * notesPerPage, page * notesPerPage);
  
  // Update note
  const handleSaveEdit = async () => {
    if (!editingNoteId) return;
    
    try {
      setLoading(true);
      const { error: updateError } = await supabase
        .from('user_notes')
        .update({ 
          note_text: editNoteText,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNoteId)
        .eq('profile_id', userId);
      
      if (updateError) {
        throw updateError;
      }
      
      setEditingNoteId(null);
      setEditNoteText('');
      
      await loadNotes();
      
      if (onNotesUpdated) {
        onNotesUpdated();
      }
    } catch (err) {
      console.error('Error updating note:', err);
      setError('Failed to update note. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a note
  const handleDeleteNote = async () => {
    if (!noteToDeleteId) return;
    
    try {
      setLoading(true);
      const { error: deleteError } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', noteToDeleteId)
        .eq('profile_id', userId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      setDeleteDialogOpen(false);
      setNoteToDeleteId(null);
      
      await loadNotes();
      
      if (onNotesUpdated) {
        onNotesUpdated();
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      setError('Failed to delete note. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete filtered notes
  const handleDeleteFilteredNotes = async () => {
    try {
      setLoading(true);
      
      // Build filter conditions
      let query = supabase
        .from('user_notes')
        .delete()
        .eq('profile_id', userId);
      
      // Apply roundId filter if provided
      if (roundId) {
        query = query.eq('round_id', roundId);
      }
      
      // Apply holeNumber filter if provided
      if (holeNumber) {
        query = query.eq('hole_number', holeNumber);
      }
      
      // Apply category filter if selected
      if (categoryFilter.length > 0) {
        query = query.in('category', categoryFilter);
      }
      
      // Apply search filter if provided
      if (searchTerm) {
        query = query.ilike('note_text', `%${searchTerm}%`);
      }
      
      const { error: deleteError } = await query;
      
      if (deleteError) {
        throw deleteError;
      }
      
      setDeleteAllDialogOpen(false);
      setPage(1);
      
      await loadNotes();
      
      if (onNotesUpdated) {
        onNotesUpdated();
      }
    } catch (err) {
      console.error('Error deleting notes:', err);
      setError('Failed to delete notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Edit a note
  const handleEditNote = (note: UserNote) => {
    setEditingNoteId(note.id);
    setEditNoteText(note.note_text);
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
  
  // Handle category filter change
  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setCategoryFilter(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Navigate to a round if clicked
  const handleRoundClick = (roundId: string) => {
    if (roundId) {
      router.push(`/rounds/${roundId}`);
    }
  };
  
  // Loading state
  if (loading && notes.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Paper 
      sx={{ 
        p: 3, 
        mb: 4, 
        maxHeight: maxHeight || 'auto',
        overflow: maxHeight ? 'auto' : 'visible'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
        <Typography variant="h6">Golf Notes</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {notes.length > 0 && (
            <Button 
              color="error" 
              size="small" 
              onClick={() => setDeleteAllDialogOpen(true)}
              startIcon={<DeleteIcon />}
            >
              Delete {filteredNotes.length !== notes.length ? 'Filtered' : 'All'}
            </Button>
          )}
        </Box>
      </Box>
      
      {/* Filters and search */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <TextField
          size="small"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200, flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        {availableCategories.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 200, flex: 1 }}>
            <InputLabel id="category-filter-label">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FilterListIcon fontSize="small" sx={{ mr: 0.5 }} />
                Filter Category
              </Box>
            </InputLabel>
            <Select
              labelId="category-filter-label"
              multiple
              value={categoryFilter}
              onChange={handleCategoryChange}
              input={<OutlinedInput label="Filter Category" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                </Box>
              )}
            >
              {availableCategories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="sort-order-label">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SortIcon fontSize="small" sx={{ mr: 0.5 }} />
              Sort
            </Box>
          </InputLabel>
          <Select
            labelId="sort-order-label"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            label="Sort"
          >
            <MenuItem value="newest">Newest First</MenuItem>
            <MenuItem value="oldest">Oldest First</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}
      
      {notes.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No notes found. {searchTerm || categoryFilter.length > 0 ? 'Try adjusting your filters.' : 'Use the Golf Assistant to add notes.'}
        </Typography>
      ) : (
        <>
          <List sx={{ width: '100%' }}>
            {paginatedNotes.map((note, index) => (
              <Box key={note.id}>
                {index > 0 && <Divider component="li" />}
                <ListItem
                  alignItems="flex-start"
                  sx={{ 
                    py: 2,
                    '&:hover': {
                      bgcolor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                  secondaryAction={
                    editingNoteId === note.id ? (
                      <>
                        <IconButton onClick={handleSaveEdit} title="Save">
                          <SaveIcon color="primary" />
                        </IconButton>
                        <IconButton onClick={() => setEditingNoteId(null)} title="Cancel">
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton 
                          onClick={() => handleEditNote(note)} 
                          title="Edit"
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
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
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {note.hole_number ? (
                      <FlagIcon color="secondary" />
                    ) : note.round_id ? (
                      <GolfCourseIcon color="primary" />
                    ) : (
                      <NoteIcon color="action" />
                    )}
                  </ListItemIcon>
                  
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
                        note.note_text
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
                          {note.updated_at && ' (edited)'}
                        </Typography>
                        
                        {/* Context information */}
                        <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                          {note.category && (
                            <Chip 
                              label={note.category} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                          )}
                          
                          {note.round_id && note.course_name && (
                            <Chip 
                              icon={<GolfCourseIcon />}
                              label={note.course_name}
                              size="small"
                              onClick={() => handleRoundClick(note.round_id!)}
                              clickable
                            />
                          )}
                          
                          {note.hole_number && (
                            <Chip 
                              icon={<FlagIcon />}
                              label={`Hole ${note.hole_number}`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                          
                          {note.tags && note.tags.length > 0 && note.tags.map(tag => (
                            <Chip 
                              key={tag}
                              label={tag} 
                              size="small" 
                              variant="outlined"
                            />
                          ))}
                        </Box>
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
                size="medium"
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
        <DialogTitle>
          Delete {filteredNotes.length !== notes.length ? 'Filtered' : 'All'} Notes
        </DialogTitle>
        <DialogContent>
          Are you sure you want to delete {filteredNotes.length !== notes.length ? 'all filtered' : 'all'} notes? 
          {filteredNotes.length !== notes.length && 
            ` This will delete ${filteredNotes.length} note(s) matching your current filters.`}
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteAllDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteFilteredNotes} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
} 