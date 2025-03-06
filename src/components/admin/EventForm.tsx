"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { format, isAfter, parseISO } from 'date-fns';
import { createEvent, getEventById, updateEvent } from '@/lib/events';
import { Event, EventFormat, ScoringType } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, refreshSchemaCache } from '@/lib/supabase';

interface Course {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

interface EventFormProps {
  eventId?: string;
  seriesId?: string;
}

export default function EventForm({ eventId, seriesId }: EventFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isEditMode = !!eventId;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [allSeries, setAllSeries] = useState<any[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(seriesId || '');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState<Date | null>(new Date());
  const [registrationCloseDate, setRegistrationCloseDate] = useState<Date | null>(null);
  const [courseId, setCourseId] = useState('');
  const [eventFormat, setEventFormat] = useState<EventFormat>('stroke_play');
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [scoringType, setScoringType] = useState<ScoringType>('gross');
  const [isStandalone, setIsStandalone] = useState(!seriesId);

  useEffect(() => {
    async function loadCourses() {
      try {
        console.log('Loading courses...');
        
        // Try to refresh the schema cache first
        await refreshSchemaCache();
        
        // Load only active courses
        const { data, error } = await supabase
          .from('courses')
          .select('id, name, location, is_active')
          .eq('is_active', true);
        
        if (error) {
          console.error('Supabase error loading courses:', error);
          
          // Handle missing is_active column
          if (error.code === '42703' && error.message.includes('is_active')) {
            console.warn('is_active column not found, loading all courses as fallback');
            
            // Try again without filtering by is_active
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('courses')
              .select('id, name, location');
              
            if (fallbackError) {
              console.error('Error in fallback course fetch:', fallbackError);
              throw fallbackError;
            }
            
            // Treat all courses as active in the fallback scenario
            const typedData = (fallbackData || []).map(item => ({
              id: String(item.id),
              name: String(item.name),
              location: String(item.location),
              isActive: true
            }));
            
            setCourses(typedData);
            return;
          }
          
          throw error;
        }
        
        console.log('Active courses data received:', data);
        
        // Type cast the data to Course[]
        const typedData = (data || []).map(item => ({
          id: String(item.id),
          name: String(item.name),
          location: String(item.location),
          isActive: Boolean(item.is_active)
        }));
        
        setCourses(typedData);
      } catch (err) {
        console.error('Error loading courses:', err);
        setError('Failed to load courses. Please try again later.');
      }
    }

    async function loadSeries() {
      try {
        const { data, error } = await supabase
          .from('series')
          .select('id, name, start_date, end_date')
          .order('start_date', { ascending: false });
        
        if (error) {
          console.error('Error loading series:', error);
          return;
        }
        
        setAllSeries(data || []);
      } catch (err) {
        console.error('Error loading series:', err);
      }
    }

    async function loadEvent() {
      if (!eventId) return;

      try {
        setLoading(true);
        const eventData = await getEventById(eventId);
        
        if (eventData) {
          setName(String(eventData.name || ''));
          setDescription(String(eventData.description || ''));
          if (eventData.event_date) {
            setEventDate(parseISO(String(eventData.event_date)));
          }
          if (eventData.registration_close_date) {
            setRegistrationCloseDate(parseISO(String(eventData.registration_close_date)));
          }
          setCourseId(String(eventData.course_id || ''));
          setEventFormat(eventData.event_format as EventFormat || 'stroke_play');
          setMaxParticipants(eventData.max_participants as number | null);
          setScoringType(eventData.scoring_type as ScoringType || 'gross');
          setIsStandalone(Boolean(eventData.is_standalone));
        }
      } catch (err) {
        console.error('Error loading event:', err);
        setError('Failed to load event data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadCourses();
    loadSeries();
    loadEvent();
  }, [eventId]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Name is required';
    }

    if (!eventDate) {
      errors.eventDate = 'Event date is required';
    }

    if (!courseId) {
      errors.courseId = 'Course is required';
    }

    if (registrationCloseDate && eventDate && isAfter(registrationCloseDate, eventDate)) {
      errors.registrationCloseDate = 'Registration close date must be before event date';
    }

    if (maxParticipants !== null && maxParticipants <= 0) {
      errors.maxParticipants = 'Maximum participants must be a positive number';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      setError('You must be logged in to create or edit an event');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const eventData = {
        name,
        description: description || null,
        event_date: eventDate ? format(eventDate, 'yyyy-MM-dd') : '',
        registration_close_date: registrationCloseDate ? format(registrationCloseDate, 'yyyy-MM-dd') : null,
        course_id: courseId,
        event_format: eventFormat,
        max_participants: maxParticipants,
        scoring_type: scoringType,
        is_standalone: isStandalone,
        status: 'upcoming' as const,
        is_active: true,
        created_by: user.id,
      };

      let createdEventId;

      if (isEditMode) {
        await updateEvent(eventId, eventData);
        createdEventId = eventId;
      } else {
        const createdEvent = await createEvent(eventData);
        createdEventId = createdEvent.id;
      }

      // If a series is selected, add the event to the series
      if (selectedSeriesId && createdEventId) {
        try {
          // Get the current count of events in the series to determine the order
          const { data: seriesEvents } = await supabase
            .from('series_events')
            .select('event_id')
            .eq('series_id', selectedSeriesId);
          
          const eventOrder = (seriesEvents?.length || 0) + 1;
          
          await supabase
            .from('series_events')
            .insert({
              series_id: selectedSeriesId,
              event_id: createdEventId,
              event_order: eventOrder,
              points_multiplier: 1
            });
        } catch (seriesError) {
          console.error('Error adding event to series:', seriesError);
          // Continue even if adding to series fails
        }
      }

      router.push(selectedSeriesId 
        ? `/admin/series/${selectedSeriesId}/events` 
        : '/admin/events');
    } catch (err) {
      console.error('Error saving event:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} event. Please try again later.`);
    } finally {
      setSubmitting(false);
    }
  };

  // Format date to YYYY-MM-DD for input type="date"
  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  // Parse date from YYYY-MM-DD string
  const parseInputDate = (dateString: string) => {
    if (!dateString) return null;
    return new Date(dateString);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', p: { xs: 2, sm: 3 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          {isEditMode ? 'Edit Event' : 'Create New Event'}
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Event Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
              size="small"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Event Date"
              type="date"
              value={eventDate ? formatDateForInput(eventDate) : ''}
              onChange={(e) => setEventDate(parseInputDate(e.target.value))}
              error={!!formErrors.eventDate}
              helperText={formErrors.eventDate}
              required
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Registration Close Date"
              type="date"
              value={registrationCloseDate ? formatDateForInput(registrationCloseDate) : ''}
              onChange={(e) => setRegistrationCloseDate(parseInputDate(e.target.value))}
              error={!!formErrors.registrationCloseDate}
              helperText={formErrors.registrationCloseDate}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!formErrors.courseId} size="small">
              <InputLabel>Course</InputLabel>
              <Select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                label="Course"
                required
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.name} - {course.location}
                  </MenuItem>
                ))}
              </Select>
              {formErrors.courseId && (
                <FormHelperText>{formErrors.courseId}</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Event Format</InputLabel>
              <Select
                value={eventFormat}
                onChange={(e) => setEventFormat(e.target.value as EventFormat)}
                label="Event Format"
              >
                <MenuItem value="stroke_play">Stroke Play</MenuItem>
                <MenuItem value="match_play">Match Play</MenuItem>
                <MenuItem value="stableford">Stableford</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Maximum Participants"
              type="number"
              value={maxParticipants || ''}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value) || null)}
              error={!!formErrors.maxParticipants}
              helperText={formErrors.maxParticipants}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Scoring Type</InputLabel>
              <Select
                value={scoringType}
                onChange={(e) => setScoringType(e.target.value as ScoringType)}
                label="Scoring Type"
              >
                <MenuItem value="gross">Gross</MenuItem>
                <MenuItem value="net">Net</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={isStandalone}
                  onChange={(e) => setIsStandalone(e.target.checked)}
                  disabled={!!seriesId}
                />
              }
              label="Standalone Event"
            />
          </Grid>

          {!isStandalone && !seriesId && (
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Series</InputLabel>
                <Select
                  value={selectedSeriesId}
                  onChange={(e) => setSelectedSeriesId(e.target.value)}
                  label="Series"
                >
                  {allSeries.map((series) => (
                    <MenuItem key={series.id} value={series.id}>
                      {series.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end',
          gap: 2,
          mt: 4,
          flexDirection: { xs: 'column', sm: 'row' }
        }}>
          <Button
            variant="outlined"
            onClick={() => router.back()}
            fullWidth={false}
            sx={{ flex: { xs: '1', sm: '0 0 auto' } }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            fullWidth={false}
            sx={{ flex: { xs: '1', sm: '0 0 auto' } }}
          >
            {submitting ? (
              <CircularProgress size={24} />
            ) : isEditMode ? (
              'Update Event'
            ) : (
              'Create Event'
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
} 