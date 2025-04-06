'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';
import { getProfilesWithEmail, updateProfile, type ProfileWithEmail } from '@/lib/profileService';
import { SelectChangeEvent } from '@mui/material/Select';
import Divider from '@mui/material/Divider';

interface FormData {
  is_admin: boolean;
  first_name: string;
  last_name: string;
  username: string | null;
}

export default function EditUser({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [user, setUser] = useState<ProfileWithEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    is_admin: false,
    first_name: '',
    last_name: '',
    username: null
  });

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        setError(null);
        const profiles = await getProfilesWithEmail();
        const profile = profiles.find(p => p.id === resolvedParams.id);
        
        if (!profile) {
          throw new Error('User not found');
        }
        
        setUser(profile);
        setFormData({
          is_admin: profile.is_admin || false,
          first_name: profile.first_name || '',
          last_name: profile.last_name || '',
          username: profile.username
        });
      } catch (error: any) {
        console.error('Error loading user:', error);
        setError(error.message || 'Failed to load user');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [resolvedParams.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      console.log('Starting user update...');
      
      // Update the profile
      await updateProfile(user?.id || '', {
        is_admin: formData.is_admin,
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username
      });
      
      setSuccess(true);
      console.log('Profile update successful');
      
      // Wait a moment to show the success message
      setTimeout(() => {
        console.log('Redirecting to users list...');
        router.push('/admin/users');
      }, 1500);
    } catch (error: any) {
      console.error('Error in form submission:', error);
      setError(error.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          component={Link}
          href="/admin/users"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Users
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        mb: { xs: 2, sm: 3 },
        gap: 2
      }}>
        <IconButton
          component={Link}
          href="/admin/users"
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography 
          variant="h4" 
          component="h1"
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            fontWeight: 'bold'
          }}
        >
          Edit User
        </Typography>
      </Box>

      <Paper 
        component="form" 
        onSubmit={handleSubmit}
        sx={{ 
          p: { xs: 2, sm: 3 },
          borderRadius: 2
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>User updated successfully!</Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              name="first_name"
              label="First Name"
              value={formData.first_name}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              name="last_name"
              label="Last Name"
              value={formData.last_name}
              onChange={handleInputChange}
              fullWidth
              required
            />
          </Box>

          <TextField
            name="username"
            label="Username"
            value={formData.username || ''}
            onChange={handleInputChange}
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={formData.is_admin}
                onChange={handleSwitchChange}
                name="is_admin"
                color="primary"
              />
            }
            label="Admin Access"
          />

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={saving}
              sx={{ minWidth: 120 }}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
            <Button
              component={Link}
              href="/admin/users"
              variant="outlined"
              disabled={saving}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
} 