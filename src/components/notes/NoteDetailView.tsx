'use client';

import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  GolfCourse as GolfCourseIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import * as notesApi from '@/lib/apiClient/notes';
import type { Note } from '@/lib/apiClient/notes';

interface NoteDetailViewProps {
  note: Note;
  onNoteUpdated?: (updatedNote: Note) => void;
  onNoteDeleted?: (noteId: string) => void;
  onRoundClick?: (roundId: string) => void;
  showFullContent?: boolean;
}

const CATEGORIES = ['general', 'swing', 'putting', 'strategy', 'equipment', 'course'];
const NOTE_STATUSES = ['added', 'working_on', 'implemented'] as const;

export default function NoteDetailView({
  note,
  onNoteUpdated,
  onNoteDeleted,
  onRoundClick,
  showFullContent = true,
}: NoteDetailViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editNoteText, setEditNoteText] = useState(note.note_text);
  const [editCategory, setEditCategory] = useState(note.category);
  const [editTags, setEditTags] = useState<string[]>(note.tags);
  const [editStatus, setEditStatus] = useState(note.status);
  const [newTag, setNewTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditNoteText(note.note_text);
    setEditCategory(note.category);
    setEditTags([...note.tags]);
    setEditStatus(note.status);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditNoteText(note.note_text);
    setEditCategory(note.category);
    setEditTags([...note.tags]);
    setEditStatus(note.status);
    setNewTag('');
    setError(null);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSaveEdit = async () => {
    if (!editNoteText.trim()) {
      setError('Note text cannot be empty');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const updatedNote = await notesApi.updateNote(note.id, {
        note_text: editNoteText.trim(),
        category: editCategory,
        tags: editTags,
        status: editStatus,
      });

      setIsEditing(false);
      onNoteUpdated?.(updatedNote);
    } catch (error) {
      console.error('Error updating note:', error);
      setError('Failed to update note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);

    try {
      await notesApi.deleteNote(note.id);
      setDeleteDialogOpen(false);
      onNoteDeleted?.(note.id);
    } catch (error) {
      console.error('Error deleting note:', error);
      setError('Failed to delete note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Note Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start',
          mb: 2 
        }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
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
              {note.round_id && (
                <Chip
                  icon={<GolfCourseIcon />}
                  label="Round Note"
                  size="small"
                  variant="outlined"
                  onClick={() => onRoundClick?.(note.round_id!)}
                  sx={{ cursor: onRoundClick ? 'pointer' : 'default' }}
                />
              )}
              {note.hole_number && (
                <Chip
                  label={`Hole ${note.hole_number}`}
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
              </Typography>
            </Box>
          </Box>

          {!isEditing && (
            <Box>
              <IconButton
                size="small"
                onClick={handleStartEdit}
                sx={{ mr: 1 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setDeleteDialogOpen(true)}
                color="error"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Note Content */}
        {isEditing ? (
          <Box>
            <TextField
              fullWidth
              label="Note"
              multiline
              rows={4}
              value={editNoteText}
              onChange={(e) => setEditNoteText(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel size="small">Category</InputLabel>
                <Select
                  size="small"
                  value={editCategory}
                  label="Category"
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  {CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel size="small">Status</InputLabel>
                <Select
                  size="small"
                  value={editStatus}
                  label="Status"
                  onChange={(e) => setEditStatus(e.target.value as typeof NOTE_STATUSES[number])}
                >
                  {NOTE_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Tags Editing */}
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Add Tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type and press Enter to add tags"
                InputProps={{
                  endAdornment: newTag.trim() && (
                    <Button size="small" onClick={handleAddTag}>
                      Add
                    </Button>
                  ),
                }}
                sx={{ mb: 1 }}
              />
              
              {editTags.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {editTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onDelete={() => handleRemoveTag(tag)}
                      variant="outlined"
                    />
                  ))}
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                startIcon={<SaveIcon />}
                onClick={handleSaveEdit}
                disabled={submitting || !editNoteText.trim()}
                variant="contained"
                size="small"
              >
                {submitting ? 'Saving...' : 'Save'}
              </Button>
              <Button
                startIcon={<CancelIcon />}
                onClick={handleCancelEdit}
                disabled={submitting}
                variant="outlined"
                size="small"
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Box>
            <Typography 
              variant="body1" 
              sx={{ 
                whiteSpace: 'pre-wrap',
                mb: 2,
                ...(showFullContent ? {} : {
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                })
              }}
            >
              {note.note_text}
            </Typography>

            {/* Tags Display */}
            {note.tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {note.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Box>
        )}
      </CardContent>

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
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            disabled={submitting}
          >
            {submitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
} 