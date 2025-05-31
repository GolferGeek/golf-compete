'use client';

import { getSeriesParticipants } from '@/api/competition/seriesParticipantService';
import { getAllProfiles } from '@/lib/profileService';
import SeriesParticipantsManagement from '@/components/series/SeriesParticipantsManagement';
import { SeriesAuthGuard } from '@/components/auth/SeriesAuthGuard';
import { useEffect, useState } from 'react';
import { CircularProgress, Box, Alert } from '@mui/material';
import { SeriesParticipant } from '@/types/series';
import { ProfileWithEmail } from '@/lib/profileService';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function SeriesParticipantsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<SeriesParticipant[]>([]);
  const [profiles, setProfiles] = useState<ProfileWithEmail[]>([]);
  const seriesId = params?.id as string;

  useEffect(() => {
    // Wait for auth to be initialized
    if (authLoading) return;

    // Redirect if no user
    if (!user) {
      console.log('No user found, redirecting to login');
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    // Check for valid series ID
    if (!seriesId) {
      console.error('Invalid series ID');
      setError('Invalid series ID');
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        console.log('Loading data for series:', seriesId);
        const [participantsData, profilesData] = await Promise.all([
          getSeriesParticipants(seriesId),
          getAllProfiles()
        ]);
        console.log('Loaded participants:', participantsData);
        console.log('Loaded profiles:', profilesData);
        setParticipants(participantsData);
        setProfiles(profilesData);
        setError(null);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load participants data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [seriesId, user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!seriesId) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Invalid series ID</Alert>
      </Box>
    );
  }

  return (
    <SeriesAuthGuard seriesId={seriesId}>
      <SeriesParticipantsManagement 
        seriesId={seriesId}
        initialParticipants={participants}
        initialAvailableUsers={profiles}
      />
    </SeriesAuthGuard>
  );
} 