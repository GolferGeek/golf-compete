'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Alert, 
  Divider 
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';
import OpenAiKeyField from './OpenAiKeyField';

// Example of integrating OpenAI key field into a profile form

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function ProfileFormExample() {
  const { user } = useAuth();
  const router = useRouter();

  // Profile state
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    username: '',
    handicap: '',
    // OpenAI settings
    openai_api_key: '',
    use_own_openai_key: false,
    ai_assistant_enabled: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load profile data
  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            username: data.username || '',
            handicap: data.handicap ? String(data.handicap) : '',
            openai_api_key: data.openai_api_key || '',
            use_own_openai_key: data.use_own_openai_key || false,
            ai_assistant_enabled: data.ai_assistant_enabled !== false, // Default to true
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user?.id]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Handle handicap input as a number
  const handleHandicapChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty value or numbers (including decimals)
    if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
      setProfile(prev => ({ ...prev, handicap: value }));
    }
  };

  // Handle OpenAI API key change
  const handleOpenAiKeyChange = (value: string) => {
    setProfile(prev => ({ ...prev, openai_api_key: value }));
  };

  // Handle use own key toggle
  const handleUseOwnKeyChange = (value: boolean) => {
    setProfile(prev => ({ ...prev, use_own_openai_key: value }));
  };

  // Handle AI assistant enabled toggle
  const handleAiAssistantEnabledChange = (value: boolean) => {
    setProfile(prev => ({ ...prev, ai_assistant_enabled: value }));
  };

  // Save profile
  const handleSave = async () => {
    if (!user?.id) return;

    try {
      setSaving(true);
      setSaveError('');
      setSaveSuccess(false);

      const updates = {
        id: user.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        username: profile.username,
        handicap: profile.handicap ? parseFloat(profile.handicap) : null,
        openai_api_key: profile.openai_api_key,
        use_own_openai_key: profile.use_own_openai_key,
        ai_assistant_enabled: profile.ai_assistant_enabled,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      setSaveSuccess(true);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Typography>Loading profile...</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Your Profile
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Box component="form" sx={{ mb: 3 }}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="First Name"
              name="first_name"
              value={profile.first_name}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Last Name"
              name="last_name"
              value={profile.last_name}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Username"
              name="username"
              value={profile.username}
              onChange={handleInputChange}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Handicap"
              name="handicap"
              value={profile.handicap}
              onChange={handleHandicapChange}
              sx={{ mb: 2 }}
            />
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* OpenAI API Key field integrated directly into the profile form */}
          <OpenAiKeyField
            openAiKey={profile.openai_api_key}
            useOwnKey={profile.use_own_openai_key}
            aiAssistantEnabled={profile.ai_assistant_enabled}
            onOpenAiKeyChange={handleOpenAiKeyChange}
            onUseOwnKeyChange={handleUseOwnKeyChange}
            onAiAssistantEnabledChange={handleAiAssistantEnabledChange}
          />

          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Profile saved successfully!
            </Alert>
          )}

          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {saveError}
            </Alert>
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
} 