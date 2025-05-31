'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  TextField,
  Button,
  Paper,
  Divider,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CategoryTagManagerProps {
  onCategoriesUpdate?: (categories: string[]) => void;
  onTagsUpdate?: (tags: string[]) => void;
}

const DEFAULT_CATEGORIES = ['general', 'swing', 'putting', 'strategy', 'equipment', 'course'];

export default function CategoryTagManager({
  onCategoriesUpdate,
  onTagsUpdate,
}: CategoryTagManagerProps) {
  const { user } = useAuth();
  const [userCategories, setUserCategories] = useState<string[]>([]);
  const [userTags, setUserTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'tag'; value: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadUserCategoriesAndTags();
    }
  }, [user]);

  const loadUserCategoriesAndTags = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const supabase = createClient();

      // Get unique categories and tags from user's notes
      const { data: notes, error: notesError } = await supabase
        .from('user_notes')
        .select('category, tags')
        .eq('profile_id', user.id);

      if (notesError) throw notesError;

      // Extract unique categories (excluding defaults)
      const categories = new Set<string>();
      const tags = new Set<string>();

      notes?.forEach(note => {
        if (note.category && !DEFAULT_CATEGORIES.includes(note.category)) {
          categories.add(note.category);
        }
        note.tags?.forEach((tag: string) => tags.add(tag));
      });

      const uniqueCategories = Array.from(categories).sort();
      const uniqueTags = Array.from(tags).sort();

      setUserCategories(uniqueCategories);
      setUserTags(uniqueTags);

      onCategoriesUpdate?.(uniqueCategories);
      onTagsUpdate?.(uniqueTags);
    } catch (error) {
      console.error('Error loading categories and tags:', error);
      setError('Failed to load categories and tags');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    
    const category = newCategory.trim().toLowerCase();
    if (DEFAULT_CATEGORIES.includes(category) || userCategories.includes(category)) {
      setError('Category already exists');
      return;
    }

    const updatedCategories = [...userCategories, category].sort();
    setUserCategories(updatedCategories);
    setNewCategory('');
    onCategoriesUpdate?.(updatedCategories);
  };

  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    const tag = newTag.trim().toLowerCase();
    if (userTags.includes(tag)) {
      setError('Tag already exists');
      return;
    }

    const updatedTags = [...userTags, tag].sort();
    setUserTags(updatedTags);
    setNewTag('');
    onTagsUpdate?.(updatedTags);
  };

  const handleDeleteCategory = async () => {
    if (!itemToDelete || itemToDelete.type !== 'category' || !user) return;

    try {
      const supabase = createClient();
      
      // Check if category is being used
      const { data: notesWithCategory, error: checkError } = await supabase
        .from('user_notes')
        .select('id')
        .eq('profile_id', user.id)
        .eq('category', itemToDelete.value)
        .limit(1);

      if (checkError) throw checkError;

      if (notesWithCategory && notesWithCategory.length > 0) {
        setError(`Cannot delete category "${itemToDelete.value}" as it's being used by notes`);
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        return;
      }

      const updatedCategories = userCategories.filter(cat => cat !== itemToDelete.value);
      setUserCategories(updatedCategories);
      onCategoriesUpdate?.(updatedCategories);
      
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      setError('Failed to delete category');
    }
  };

  const handleDeleteTag = async () => {
    if (!itemToDelete || itemToDelete.type !== 'tag' || !user) return;

    try {
      const supabase = createClient();
      
      // Check if tag is being used
      const { data: notesWithTag, error: checkError } = await supabase
        .from('user_notes')
        .select('id')
        .eq('profile_id', user.id)
        .contains('tags', [itemToDelete.value])
        .limit(1);

      if (checkError) throw checkError;

      if (notesWithTag && notesWithTag.length > 0) {
        setError(`Cannot delete tag "${itemToDelete.value}" as it's being used by notes`);
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        return;
      }

      const updatedTags = userTags.filter(tag => tag !== itemToDelete.value);
      setUserTags(updatedTags);
      onTagsUpdate?.(updatedTags);
      
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting tag:', error);
      setError('Failed to delete tag');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, type: 'category' | 'tag') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'category') {
        handleAddCategory();
      } else {
        handleAddTag();
      }
    }
  };

  const openDeleteDialog = (type: 'category' | 'tag', value: string) => {
    setItemToDelete({ type, value });
    setDeleteDialogOpen(true);
  };

  if (!user) return null;

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Categories Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Categories
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Default categories: {DEFAULT_CATEGORIES.join(', ')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            label="New Category"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'category')}
            placeholder="e.g., mental-game"
          />
          <Button
            onClick={handleAddCategory}
            disabled={!newCategory.trim()}
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
          >
            Add
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {userCategories.map((category) => (
            <Chip
              key={category}
              label={category}
              variant="outlined"
              color="primary"
              onDelete={() => openDeleteDialog('category', category)}
              deleteIcon={<DeleteIcon />}
            />
          ))}
          {userCategories.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No custom categories yet
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Tags Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tags
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Create custom tags to organize your notes
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            label="New Tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'tag')}
            placeholder="e.g., driver, iron-play"
          />
          <Button
            onClick={handleAddTag}
            disabled={!newTag.trim()}
            startIcon={<AddIcon />}
            variant="outlined"
            size="small"
          >
            Add
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {userTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              variant="outlined"
              color="secondary"
              onDelete={() => openDeleteDialog('tag', tag)}
              deleteIcon={<DeleteIcon />}
            />
          ))}
          {userTags.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No tags yet
            </Typography>
          )}
        </Box>
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>
          Delete {itemToDelete?.type === 'category' ? 'Category' : 'Tag'}
        </DialogTitle>
        <DialogContent>
          Are you sure you want to delete the {itemToDelete?.type} "{itemToDelete?.value}"?
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={itemToDelete?.type === 'category' ? handleDeleteCategory : handleDeleteTag}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 