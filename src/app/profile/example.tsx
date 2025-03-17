'use client';

import { useState } from 'react';
import { Container, Typography, Box, Tabs, Tab, Divider, Grid } from '@mui/material';
import AiSettings from '@/components/profile/AiSettings';
import { useAuth } from '@/contexts/AuthContext';

// This is an example profile page showing how to integrate AI settings.
// This would be part of your actual profile page.

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ProfilePageExample() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>Please log in to view your profile.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Your Profile
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="subtitle1">
          {user.email}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Member since {new Date(user.created_at || Date.now()).toLocaleDateString()}
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
          <Tab label="Account" id="profile-tab-0" aria-controls="profile-tabpanel-0" />
          <Tab label="Preferences" id="profile-tab-1" aria-controls="profile-tabpanel-1" />
          <Tab label="AI Assistant" id="profile-tab-2" aria-controls="profile-tabpanel-2" />
        </Tabs>
      </Box>
      
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h6" gutterBottom>
          Account Settings
        </Typography>
        
        {/* Account settings would go here */}
        <Box sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          Account settings content would go here
        </Box>
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <Typography variant="h6" gutterBottom>
          Preferences
        </Typography>
        
        {/* User preferences would go here */}
        <Box sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          User preferences content would go here
        </Box>
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <Typography variant="h6" gutterBottom>
          AI Assistant Settings
        </Typography>
        
        <Typography variant="body2" paragraph color="text.secondary">
          Configure your AI Golf Assistant settings, including voice preferences and API access.
        </Typography>
        
        {/* AI Settings Component */}
        <AiSettings userId={user.id} onSaved={() => alert('Settings saved!')} />
      </TabPanel>
    </Container>
  );
} 