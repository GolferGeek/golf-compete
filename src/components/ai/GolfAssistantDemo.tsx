'use client';

import { useState } from 'react';
import { Container, Typography, Box, Paper, Tab, Tabs, Button, Alert, Divider } from '@mui/material';
import GolfAssistant from './GolfAssistant';
import VoiceRecorder from './VoiceRecorder';
import MicIcon from '@mui/icons-material/Mic';
import InfoIcon from '@mui/icons-material/Info';

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
      id={`golf-assistant-tabpanel-${index}`}
      aria-labelledby={`golf-assistant-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function GolfAssistantDemo() {
  const [tabValue, setTabValue] = useState(0);
  const [demoResponse, setDemoResponse] = useState<string | null>(null);
  const [demoRoundId, setDemoRoundId] = useState<string | null>(null);
  const [demoHoleNumber, setDemoHoleNumber] = useState<number | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDemoRecording = (response: string, data?: any) => {
    setDemoResponse(response);
    
    // Update context if there's a round ID or hole number in the response
    if (data?.parameters?.roundId) {
      setDemoRoundId(data.parameters.roundId);
    }
    
    if (data?.parameters?.holeNumber || data?.parameters?.hole) {
      setDemoHoleNumber(data.parameters.holeNumber || data.parameters.hole);
    }
  };

  const handleCommandProcessed = (result: any) => {
    if (result.success && result.data) {
      if (result.data.roundId) {
        setDemoRoundId(result.data.roundId);
      }
      
      if (result.data.holeNumber) {
        setDemoHoleNumber(result.data.holeNumber);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        AI Golf Assistant
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Voice-enabled AI to improve your golf game
        </Typography>
        <Typography variant="body1" paragraph>
          Speak to the Golf Assistant to manage your rounds, track scores, and get help with your game.
          Try saying things like "Start a new round at Pinehurst", "I got a 5 on hole 3", or "Add a note: my drive was slicing today".
        </Typography>
      </Box>
      
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="subtitle1">Demo Version</Typography>
        <Typography variant="body2">
          This is a demo of the AI Golf Assistant. In this version, you can try the voice interface and see 
          how the AI responds to your commands. The assistant can understand commands to start rounds, record scores, 
          add notes, and answer golf-related questions.
        </Typography>
      </Alert>
      
      <Paper sx={{ mb: 4 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Chat Interface" />
          <Tab label="Voice Only" />
          <Tab label="About" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <GolfAssistant 
            contextData={
              (demoRoundId || demoHoleNumber) ? {
                roundId: demoRoundId || undefined,
                holeNumber: demoHoleNumber || undefined
              } : undefined
            }
            onCommandProcessed={handleCommandProcessed}
          />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Voice Command Demo
            </Typography>
            
            {demoResponse && (
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 2, 
                  mb: 4, 
                  mx: 'auto',
                  maxWidth: 500, 
                  bgcolor: 'background.paper'
                }}
              >
                <Typography variant="body1">
                  {demoResponse}
                </Typography>
                
                {(demoRoundId || demoHoleNumber) && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      Context: {demoRoundId ? `Round ID: ${demoRoundId.substring(0, 8)}...` : ''} 
                      {demoHoleNumber ? ` Hole: ${demoHoleNumber}` : ''}
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}
            
            <VoiceRecorder 
              onProcessed={handleDemoRecording} 
              contextData={
                (demoRoundId || demoHoleNumber) ? {
                  roundId: demoRoundId || undefined,
                  holeNumber: demoHoleNumber || undefined
                } : undefined
              }
              buttonLabel="Try Voice Command"
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Click the button and speak a golf-related command
            </Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ maxWidth: 700, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom>
              About the AI Golf Assistant
            </Typography>
            
            <Typography variant="body1" paragraph>
              The AI Golf Assistant is designed to help golfers manage their rounds, track performance, 
              and improve their game using natural voice commands. It combines the power of OpenAI's 
              technologies with GolfCompete's golf management platform.
            </Typography>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Key Features
            </Typography>
            
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body1" paragraph>
                <strong>Voice Control</strong>: Start rounds, record scores, and add notes hands-free
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>Natural Language</strong>: Speak naturally without memorizing specific commands
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>Context-Aware</strong>: The assistant remembers your current round and hole
              </Typography>
              <Typography component="li" variant="body1" paragraph>
                <strong>Golf Knowledge</strong>: Ask questions about golf rules, techniques, and more
              </Typography>
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Privacy & Data Usage
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Audio recordings are processed using OpenAI's Whisper and GPT models. 
              Voice data is not stored longer than necessary for processing your commands.
              Command history is stored to provide context for future interactions and improve the service.
            </Typography>
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
} 