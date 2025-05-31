'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabaseClient as supabase } from '@/lib/auth';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import Scorecard from '@/components/events/Scorecard';
import { EventAuthGuard } from '@/components/auth/EventAuthGuard';

interface Round {
  id: string;
  total_score: number | null;
  total_putts: number | null;
  fairways_hit: number | null;
  greens_in_regulation: number | null;
  player_name: string;
}

export default function EventScoringPage() {
  const params = useParams();
  const eventId = params?.id as string;
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRounds = async () => {
      try {
        console.log(`Fetching rounds for event ID: ${eventId}`);
        
        // First, get all rounds for this event
        const { data: roundsData, error: roundsError } = await supabase
          .from('rounds')
          .select('id, profile_id, total_score, total_putts, fairways_hit, greens_in_regulation')
          .eq('event_id', eventId);

        if (roundsError) {
          console.error('Error fetching rounds:', roundsError);
          throw roundsError;
        }
        
        console.log(`Found ${roundsData?.length || 0} rounds for event`);
        
        if (!roundsData || roundsData.length === 0) {
          setRounds([]);
          setLoading(false);
          return;
        }

        // Get profile names for each round
        const profileIds = roundsData.map(round => round.profile_id).filter(Boolean);
        console.log(`Getting profiles for IDs:`, profileIds);
        
        let profileMap = new Map();
        
        if (profileIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, name')
            .in('id', profileIds);

          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            // Continue without profile data rather than failing
          } else if (profilesData && profilesData.length > 0) {
            console.log(`Found ${profilesData.length} profiles`);
            // Create a map of profile IDs to properly formatted names
            profilesData.forEach(profile => {
              let displayName = profile.name || 'Player';
              
              // If first_name and last_name exist, prefer those
              if (profile.first_name || profile.last_name) {
                displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
              }
              
              profileMap.set(profile.id, displayName);
            });
          } else {
            console.log('No profiles found for the given profile IDs');
          }
        }

        // Combine the data - with better handling for missing profiles
        const formattedRounds = roundsData.map(round => {
          // Log if a profile is missing
          if (!profileMap.has(round.profile_id)) {
            console.log(`No profile found for ID: ${round.profile_id} in round: ${round.id}`);
          }
          
          return {
            id: round.id as string,
            total_score: round.total_score as number | null,
            total_putts: round.total_putts as number | null,
            fairways_hit: round.fairways_hit as number | null,
            greens_in_regulation: round.greens_in_regulation as number | null,
            player_name: profileMap.get(round.profile_id) || 'Player'
          };
        });

        setRounds(formattedRounds as Round[]);
      } catch (err) {
        console.error('Error in fetchRounds:', err);
        setError('Failed to load event data. Please check console for details.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchRounds();
    }

    // Set up real-time subscription
    const subscription = supabase
      .channel(`event-rounds-${eventId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'rounds', 
        filter: `event_id=eq.${eventId}` 
      }, () => {
        fetchRounds();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

  const content = (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 4 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <>
          <Typography variant="h4" gutterBottom>Event Scorecard</Typography>
          <Paper sx={{ p: 3 }}>
            <Scorecard rounds={rounds} />
          </Paper>
        </>
      )}
    </Box>
  );

  return (
    <EventAuthGuard eventId={eventId}>
      {content}
    </EventAuthGuard>
  );
} 