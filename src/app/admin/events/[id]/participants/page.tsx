"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Breadcrumbs, Link as MuiLink, Button, CircularProgress, Alert } from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventParticipants from '@/components/admin/EventParticipants';
import { getEventById } from '@/lib/events';

interface EventParticipantsPageProps {
  params: {
    id: string;
  };
}

export default function EventParticipantsPage({ params }: EventParticipantsPageProps) {
  const router = useRouter();
  const unwrappedParams = React.use(params as any) as { id: string };
  const eventId = unwrappedParams.id;
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEvent() {
      try {
        setLoading(true);
        const eventData = await getEventById(eventId);
        setEvent(eventData);
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadEvent();
  }, [eventId]);

  if (loading) {
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
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.push('/admin/events')}
          sx={{ mt: 2 }}
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link href="/admin" passHref legacyBehavior>
            <MuiLink underline="hover" color="inherit">
              Admin
            </MuiLink>
          </Link>
          <Link href="/admin/events" passHref legacyBehavior>
            <MuiLink underline="hover" color="inherit">
              Events
            </MuiLink>
          </Link>
          <Typography color="text.primary">Participants</Typography>
        </Breadcrumbs>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {event?.name} - Participants
        </Typography>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/events')}
        >
          Back to Events
        </Button>
      </Box>
      
      <EventParticipants eventId={eventId} />
    </Box>
  );
} 