'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  FormControlLabel, 
  Switch, 
  TextField, 
  Button, 
  Alert, 
  RadioGroup,
  Radio,
  InputAdornment,
  IconButton,
  Collapse,
  Paper,
  Divider
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import { getUserAIPreferences, updateUserAIPreferences, AIPreferences } from '@/services/ai/clientAiService';

interface AiSettingsProps {
  userId: string;
  onSaved?: () => void;
}

export default function AiSettings({ userId, onSaved }: AiSettingsProps) {
  const [preferences, setPreferences] = useState<AIPreferences>({
    voiceEnabled: true,
    apiKeySource: 'app',
    voiceType: 'alloy',
    speakingRate: 1.0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  // Load existing preferences
  useEffect(() => {
    async function loadPreferences() {
      if (userId) {
        try {
          setLoading(true);
          const prefs = await getUserAIPreferences(userId);
          setPreferences(prefs);
        } catch (error) {
          console.error('Error loading AI preferences:', error);
        } finally {
          setLoading(false);
        }
      }
    }
    
    loadPreferences();
  }, [userId]);
  
  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setSaveError('');
      
      await updateUserAIPreferences(userId, preferences);
      
      setSaveSuccess(true);
      if (onSaved) {
        onSaved();
      }
    } catch (error) {
      console.error('Error saving AI preferences:', error);
      setSaveError('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      userApiKey: event.target.value
    }));
  };
  
  const handleSourceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      apiKeySource: event.target.value as 'app' | 'user'
    }));
  };
  
  const handleVoiceEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      voiceEnabled: event.target.checked
    }));
  };
  
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        AI Assistant Settings
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      {loading ? (
        <Typography>Loading preferences...</Typography>
      ) : (
        <Box>
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.voiceEnabled}
                  onChange={handleVoiceEnabledChange}
                  name="voiceEnabled"
                  color="primary"
                />
              }
              label="Enable voice assistant"
            />
            <Typography variant="caption" color="text.secondary">
              When enabled, the AI golf assistant will be available throughout the app
            </Typography>
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom>
            OpenAI API Access
          </Typography>
          
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <RadioGroup
              aria-label="API Key Source"
              name="apiKeySource"
              value={preferences.apiKeySource}
              onChange={handleSourceChange}
            >
              <FormControlLabel 
                value="app" 
                control={<Radio />} 
                label="Use GolfCompete's shared API key" 
              />
              <FormControlLabel 
                value="user" 
                control={<Radio />} 
                label="Use my own OpenAI API key" 
              />
            </RadioGroup>
            
            <Collapse in={preferences.apiKeySource === 'user'}>
              <Box sx={{ mt: 2, mb: 1 }}>
                <TextField
                  fullWidth
                  label="Your OpenAI API Key"
                  variant="outlined"
                  value={preferences.userApiKey || ''}
                  onChange={handleApiKeyChange}
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle api key visibility"
                          onClick={() => setShowApiKey(!showApiKey)}
                          edge="end"
                        >
                          {showApiKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Using your own API key allows for faster processing and ensures you have full control over usage.
                </Typography>
                
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Your API key is stored securely and is only used for your own interactions with the AI assistant.
                    You can get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI's website</a>.
                  </Typography>
                </Alert>
              </Box>
            </Collapse>
          </FormControl>
          
          {saveSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Settings saved successfully!
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
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      )}
    </Paper>
  );
} 