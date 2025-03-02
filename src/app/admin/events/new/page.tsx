"use client";

import React from 'react';
import EventForm from '@/components/admin/EventForm';
import { Box, Typography, Breadcrumbs, Link as MuiLink } from '@mui/material';
import Link from 'next/link';

export default function NewEventPage() {
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
          <Typography color="text.primary">New Event</Typography>
        </Breadcrumbs>
      </Box>
      
      <EventForm />
    </Box>
  );
} 