'use client';

import React, { useState } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
} from '@mui/material';
import {
  StickyNote2 as NoteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface QuickNoteButtonProps {
  roundId?: string;
  holeNumber?: number;
  onNoteCreated?: () => void;
  position?: {
    bottom?: number;
    right?: number;
    left?: number;
    top?: number;
  };
}

const CATEGORIES = ['general', 'swing', 'putting', 'strategy', 'equipment', 'course'];

export default function QuickNoteButton({
  roundId,
  holeNumber,
  onNoteCreated,
  position = { bottom: 24, right: 24 }
}: QuickNoteButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [category, setCategory] = useState('general');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async () => {
    if (!user || !noteText.trim()) {
      setError('Please enter some note text');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { error: noteError } = await supabase
        .from('user_notes')
        .insert({
          profile_id: user.id,
          note_text: noteText.trim(),
          category,
          round_id: roundId || null,
          hole_number: holeNumber || null,
          tags,
          status: 'added',
        });

      if (noteError) throw noteError;

      // Reset form
      setNoteText('');
      setCategory('general');
      setTags([]);
      setOpen(false);
      
      onNoteCreated?.();
    } catch (error) {
      console.error('Error creating note:', error);
      setError('Failed to save note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setNoteText('');
    setCategory('general');
    setTags([]);
    setError(null);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="add note"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          ...position,
          zIndex: 1000,
        }}
      >
        <NoteIcon />
      </Fab>

      {/* Quick Note Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            mx: 2,
            width: 'calc(100% - 32px)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 1
        }}>
          Quick Note
          {roundId && (
            <Chip 
              label={holeNumber ? `Hole ${holeNumber}` : 'Round Note'} 
              size="small" 
              variant="outlined" 
            />
          )}
          <IconButton
            edge="end"
            onClick={handleClose}
            sx={{ ml: 1 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Note"
            multiline
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={roundId 
              ? "Quick thought during your round..." 
              : "Add a golf note..."
            }
            sx={{ mb: 2 }}
            autoFocus
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={category}
              label="Category"
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Tags Section */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
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
              size="small"
            />
            
            {tags.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {tags.map((tag) => (
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
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!noteText.trim() || submitting}
          >
            {submitting ? 'Saving...' : 'Save Note'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 