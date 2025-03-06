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
import { fetchUserById, upsertUserProfile, User, Profile } from '@/services/admin/userService';
import { SelectChangeEvent } from '@mui/material/Select';
import Divider from '@mui/material/Divider';

interface FormData {
  is_admin: boolean;
  active: boolean;
  first_name: string;
  last_name: string;
}

export default function EditUser({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    is_admin: false,
    active: true,
    first_name: '',
    last_name: '',
  });

  useEffect(() => {
    async function loadUser() {
      try {
        setLoading(true);
        setError(null);
        const userData = await fetchUserById(resolvedParams.id);
        setUser(userData);
        setFormData({
          is_admin: userData.profile?.is_admin || false,
          active: userData.active || true,
          first_name: userData.profile?.first_name || '',
          last_name: userData.profile?.last_name || '',
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
      
      // Only send admin-manageable fields
      const adminUpdates = {
        id: user?.id || '',
        is_admin: formData.is_admin,
        first_name: formData.first_name,
        last_name: formData.last_name,
      };
      
      console.log('Updating profile with:', adminUpdates);
      
      try {
        // Update the profile
        await upsertUserProfile(adminUpdates);
        console.log('Profile update successful');
      } catch (error: any) {
        console.error('Profile update failed:', error);
        throw new Error(`Failed to update profile: ${error.message || 'Unknown error'}`);
      }

      console.log('Updating user status...');
      // Update user active status via auth API
      try {
        const response = await fetch(`/api/users/${user?.id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ active: formData.active }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update user status');
        }
        console.log('Status update successful');
      } catch (error: any) {
        console.error('Status update failed:', error);
        throw new Error(`Failed to update status: ${error.message || 'Unknown error'}`);
      }
      
      setSuccess(true);
      console.log('All updates completed successfully');
      
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

        {/* User Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            User Information
          </Typography>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography>{user?.email}</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Username
              </Typography>
              <Typography>
                {user?.profile?.username || 'Not set'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Name Information */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Name Information
          </Typography>
          <Box sx={{ display: 'grid', gap: 3 }}>
            <TextField
              required
              fullWidth
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
            />
            <TextField
              required
              fullWidth
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Administrative Controls */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Administrative Controls
          </Typography>
          <Box sx={{ display: 'grid', gap: 3, maxWidth: 'sm' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_admin}
                  onChange={handleSwitchChange}
                  name="is_admin"
                />
              }
              label="Administrator Access"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.active}
                  onChange={handleSwitchChange}
                  name="active"
                />
              }
              label="Account Active"
            />
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            type="submit"
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
      </Paper>
    </Box>
  );
} 