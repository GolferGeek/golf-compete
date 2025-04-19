'use client';

import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'next/navigation';
import * as notesApi from '@/lib/apiClient/notes';
import type { Note } from '@/lib/apiClient/notes';

interface UserNotesManagerProps {
  userId: string;
  roundId?: string;
  holeNumber?: number;
  onNotesUpdated?: () => void;
  maxHeight?: string | number;
}

const NOTES_PER_PAGE = 10;
const CATEGORIES = ['general', 'swing', 'putting', 'strategy', 'equipment'];
const NOTE_STATUSES = ['added', 'working_on', 'implemented'] as const;

export default function UserNotesManager({ 
  userId, 
  roundId,
  holeNumber,
  onNotesUpdated,
  maxHeight = 600
}: UserNotesManagerProps) {
  // State for notes and UI
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editNoteCategory, setEditNoteCategory] = useState('general');
  const [editNoteTags, setEditNoteTags] = useState<string[]>([]);
  const [editNoteStatus, setEditNoteStatus] = useState<typeof NOTE_STATUSES[number]>('added');
  
  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<typeof NOTE_STATUSES[number] | ''>('');
  const [sortBy, setSortBy] = useState<'created_at' | 'updated_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);
  const [newNoteDialogOpen, setNewNoteDialogOpen] = useState(false);
  
  const router = useRouter();
  
  // Load notes
  useEffect(() => {
    loadNotes();
  }, [userId, roundId, holeNumber, selectedCategories, selectedStatus, sortBy, sortOrder, searchTerm, page]);
  
  async function loadNotes() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await notesApi.fetchNotesList({
        page,
        limit: NOTES_PER_PAGE,
        sortBy,
        sortOrder,
        search: searchTerm || undefined,
        category: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
        status: selectedStatus || undefined,
        roundId,
        holeNumber,
      });
      
      setNotes(response.data);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError('Failed to load notes');
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  }
  
  const handleCreateNote = async () => {
    try {
      await notesApi.createNote({
        note_text: editNoteText,
        category: editNoteCategory,
        tags: editNoteTags,
        status: editNoteStatus,
        round_id: roundId || null,
        hole_number: holeNumber || null,
      });
      
      setNewNoteDialogOpen(false);
      setEditNoteText('');
      setEditNoteCategory('general');
      setEditNoteTags([]);
      setEditNoteStatus('added');
      loadNotes();
      onNotesUpdated?.();
    } catch (err) {
      setError('Failed to create note');
      console.error('Error creating note:', err);
    }
  };
  
  const handleUpdateNote = async (noteId: string) => {
    try {
      await notesApi.updateNote(noteId, {
        note_text: editNoteText,
        category: editNoteCategory,
        tags: editNoteTags,
        status: editNoteStatus,
      });
      
      setEditingNoteId(null);
      setEditNoteText('');
      setEditNoteCategory('general');
      setEditNoteTags([]);
      setEditNoteStatus('added');
      loadNotes();
      onNotesUpdated?.();
    } catch (err) {
      setError('Failed to update note');
      console.error('Error updating note:', err);
    }
  };
  
  const handleDeleteNote = async () => {
    if (!noteToDeleteId) return;
    
    try {
      await notesApi.deleteNote(noteToDeleteId);
      setDeleteDialogOpen(false);
      setNoteToDeleteId(null);
      loadNotes();
      onNotesUpdated?.();
    } catch (err) {
      setError('Failed to delete note');
      console.error('Error deleting note:', err);
    }
  };
  
  const startEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditNoteText(note.note_text);
    setEditNoteCategory(note.category);
    setEditNoteTags(note.tags);
    setEditNoteStatus(note.status);
  };
  
  const cancelEdit = () => {
    setEditingNoteId(null);
    setEditNoteText('');
    setEditNoteCategory('general');
    setEditNoteTags([]);
    setEditNoteStatus('added');
  };
  
  const handleRoundClick = (roundId: string) => {
    router.push(`/rounds/${roundId}`);
  };
  
  return (
    <Box sx={{ maxHeight, overflow: 'auto' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1 }}
        />
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Category</InputLabel>
          <Select
            multiple
            value={selectedCategories}
            onChange={(e) => setSelectedCategories(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
            input={<OutlinedInput label="Category" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as typeof NOTE_STATUSES[number] | '')}
            input={<OutlinedInput label="Status" />}
          >
            <MenuItem value="">All</MenuItem>
            {NOTE_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {status.replace('_', ' ')}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="contained"
          onClick={() => setNewNoteDialogOpen(true)}
        >
          Add Note
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <List>
            {notes.map((note) => (
              <React.Fragment key={note.id}>
                <ListItem
                  secondaryAction={
                    <Box>
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => startEdit(note)}
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
                    </Box>
                  }
                >
                  <ListItemIcon>
                    {note.round_id ? <GolfCourseIcon /> : <NoteIcon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      editingNoteId === note.id ? (
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                          <TextField
                            fullWidth
                            multiline
                            value={editNoteText}
                            onChange={(e) => setEditNoteText(e.target.value)}
                            size="small"
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleUpdateNote(note.id)}
                          >
                            <SaveIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={cancelEdit}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        note.note_text
                      )
                    }
                    secondary={
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                        <Chip
                          label={note.category}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={note.status.replace('_', ' ')}
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                        {note.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {note.round_id && (
                          <Button
                            size="small"
                            onClick={() => handleRoundClick(note.round_id!)}
                            startIcon={<GolfCourseIcon />}
                          >
                            View Round
                          </Button>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(note.created_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Note</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this note?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteNote} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      
      {/* New Note Dialog */}
      <Dialog
        open={newNoteDialogOpen}
        onClose={() => setNewNoteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Note</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Note"
              multiline
              rows={4}
              value={editNoteText}
              onChange={(e) => setEditNoteText(e.target.value)}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={editNoteCategory}
                onChange={(e) => setEditNoteCategory(e.target.value)}
                label="Category"
              >
                {CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editNoteStatus}
                onChange={(e) => setEditNoteStatus(e.target.value as typeof NOTE_STATUSES[number])}
                label="Status"
              >
                {NOTE_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status.replace('_', ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              label="Tags"
              placeholder="Add tags (comma separated)"
              value={editNoteTags.join(', ')}
              onChange={(e) => setEditNoteTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateNote} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 