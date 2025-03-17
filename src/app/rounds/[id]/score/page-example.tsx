'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Container, Typography, Box } from '@mui/material';
import { useAssistantContext } from '@/hooks/useAssistantContext';

// This is just an example file showing how to integrate the Golf Assistant
// with a scoring page. This won't be used in the actual app.

export default function RoundScoringPageExample() {
  const params = useParams();
  const roundId = params?.id as string;
  const [currentHole, setCurrentHole] = useState(1);
  
  // Update the golf assistant context whenever the round ID or current hole changes
  useAssistantContext(
    {
      roundId: roundId,
      holeNumber: currentHole,
      // You can add other context as needed
      pageType: 'scoring'
    },
    [roundId, currentHole]
  );
  
  // Example function to change the current hole
  const handleNextHole = () => {
    setCurrentHole(prev => prev + 1);
  };
  
  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Round Scoring
      </Typography>
      
      <Typography variant="subtitle1">
        Round ID: {roundId}
      </Typography>
      
      <Typography variant="h5" sx={{ mt: 4 }}>
        Hole {currentHole}
      </Typography>
      
      <Box sx={{ mt: 2, color: 'text.secondary' }}>
        <Typography variant="body2">
          The Golf Assistant is now aware of this round and hole context.
        </Typography>
        <Typography variant="body2">
          Try asking the assistant to "record a 4 for this hole" or "add a note about my drive".
        </Typography>
      </Box>
      
      {/* Rest of your scoring interface */}
    </Container>
  );
} 