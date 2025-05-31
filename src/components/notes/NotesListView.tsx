'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Grid,
  Paper,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Fab,
  Pagination,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import * as notesApi from '@/lib/apiClient/notes';
import type { Note } from '@/lib/apiClient/notes';
import NoteDetailView from './NoteDetailView';

interface NotesListViewProps {
  userId: string;
  roundId?: string;
  holeNumber?: number;
  onNoteCreated?: () => void;
  showCreateButton?: boolean;
  maxHeight?: string | number;
}

const CATEGORIES = ['general', 'swing', 'putting', 'strategy', 'equipment', 'course'];
const NOTE_STATUSES = ['added', 'working_on', 'implemented'] as const;
const NOTES_PER_PAGE = 10;

type SortOption = 'created_desc' | 'created_asc' | 'updated_desc' | 'updated_asc' | 'category';

export default function NotesListView({
  userId,
  roundId,
  holeNumber,
  onNoteCreated,
  showCreateButton = true,
  maxHeight = '80vh',
}: NotesListViewProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();

  // State for notes and UI
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('created_desc');
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Load notes
  useEffect(() => {
    loadNotes();
  }, [userId, roundId, holeNumber, searchTerm, selectedCategories, selectedStatus, sortBy, page]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sortField, sortOrder] = sortBy.split('_') as [string, 'asc' | 'desc'];
      
      const response = await notesApi.fetchNotesList({
        page,
        limit: NOTES_PER_PAGE,
        sortBy: sortField === 'created' ? 'created_at' : 
               sortField === 'updated' ? 'updated_at' : sortField,
        sortOrder,
        search: searchTerm || undefined,
        category: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
        status: (selectedStatus as typeof NOTE_STATUSES[number]) || undefined,
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
  };

  const handleNoteUpdated = (updatedNote: Note) => {
    setNotes(prev => prev.map(note => 
      note.id === updatedNote.id ? updatedNote : note
    ));
  };

  const handleNoteDeleted = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    // Reload if we deleted the last note on the page
    if (notes.length === 1 && page > 1) {
      setPage(page - 1);
    } else {
      loadNotes();
    }
  };

  const handleRoundClick = (roundId: string) => {
    router.push(`/rounds/${roundId}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedStatus('');
    setSortBy('created_desc');
    setPage(1);
  };

  const hasActiveFilters = searchTerm || selectedCategories.length > 0 || selectedStatus;

  return (
    <Box sx={{ height: maxHeight, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Notes {notes.length > 0 && `(${notes.length})`}
        </Typography>

        {/* Search */}
        <TextField
          fullWidth
          size="small"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <Button
                  size="small"
                  onClick={() => setSearchTerm('')}
                  sx={{ minWidth: 'auto', p: 0.5 }}
                >
                  <ClearIcon fontSize="small" />
                </Button>
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      </Box>

      {/* Filters */}
      <Accordion 
        expanded={filtersExpanded} 
        onChange={() => setFiltersExpanded(!filtersExpanded)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            <Typography variant="body2">
              Filters & Sorting
            </Typography>
            {hasActiveFilters && (
              <Chip label="Active" size="small" color="primary" />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200, flexGrow: 1 }}>
                <InputLabel>Categories</InputLabel>
                <Select
                  multiple
                  value={selectedCategories}
                  label="Categories"
                  onChange={(e) => {
                    setSelectedCategories(typeof e.target.value === 'string' 
                      ? e.target.value.split(',') 
                      : e.target.value);
                    setPage(1);
                  }}
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
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {NOTE_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <MenuItem value="created_desc">Newest First</MenuItem>
                  <MenuItem value="created_asc">Oldest First</MenuItem>
                  <MenuItem value="updated_desc">Recently Updated</MenuItem>
                  <MenuItem value="updated_asc">Least Recently Updated</MenuItem>
                  <MenuItem value="category">Category</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {hasActiveFilters && (
              <Box>
                <Button
                  onClick={clearFilters}
                  startIcon={<ClearIcon />}
                  size="small"
                >
                  Clear All Filters
                </Button>
              </Box>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Notes List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : notes.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              {hasActiveFilters ? 'No notes match your filters' : 'No notes yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {hasActiveFilters 
                ? 'Try adjusting your search terms or filters'
                : 'Start taking notes to track your golf improvement'
              }
            </Typography>
            {hasActiveFilters ? (
              <Button onClick={clearFilters} variant="outlined">
                Clear Filters
              </Button>
            ) : showCreateButton && (
              <Button 
                variant="contained" 
                onClick={() => router.push('/profile/notes')}
              >
                Create First Note
              </Button>
            )}
          </Paper>
        ) : (
          <Box sx={{ pb: 2 }}>
            {notes.map((note) => (
              <NoteDetailView
                key={note.id}
                note={note}
                onNoteUpdated={handleNoteUpdated}
                onNoteDeleted={handleNoteDeleted}
                onRoundClick={handleRoundClick}
                showFullContent={!isMobile}
              />
            ))}
          </Box>
        )}
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            size={isMobile ? 'small' : 'medium'}
          />
        </Box>
      )}

      {/* Create Note FAB */}
      {showCreateButton && (
        <Fab
          color="primary"
          aria-label="add note"
          onClick={() => router.push('/profile/notes')}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
} 