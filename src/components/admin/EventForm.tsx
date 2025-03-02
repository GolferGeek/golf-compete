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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {isEditMode ? 'Edit Event' : 'Create New Event'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                label="Event Name"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.courseId}>
                <InputLabel>Course</InputLabel>
                <Select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  label="Course"
                  disabled={submitting}
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name} ({course.location}) {!course.isActive && '(Inactive)'}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.courseId && (
                  <FormHelperText>{formErrors.courseId}</FormHelperText>
                )}
                {!formErrors.courseId && (
                  <FormHelperText>
                    Select a course for this event. Inactive courses can be activated in the course management section.
                  </FormHelperText>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Event Format</InputLabel>
                <Select
                  value={eventFormat}
                  onChange={(e) => setEventFormat(e.target.value as EventFormat)}
                  label="Event Format"
                  disabled={submitting}
                >
                  <MenuItem value="stroke_play">Stroke Play</MenuItem>
                  <MenuItem value="match_play">Match Play</MenuItem>
                  <MenuItem value="stableford">Stableford</MenuItem>
                  <MenuItem value="scramble">Scramble</MenuItem>
                  <MenuItem value="best_ball">Best Ball</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Event Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={eventDate ? formatDateForInput(eventDate) : ''}
                onChange={(e) => setEventDate(parseInputDate(e.target.value))}
                error={!!formErrors.eventDate}
                helperText={formErrors.eventDate}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Registration Close Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={registrationCloseDate ? formatDateForInput(registrationCloseDate) : ''}
                onChange={(e) => setRegistrationCloseDate(parseInputDate(e.target.value))}
                error={!!formErrors.registrationCloseDate}
                helperText={formErrors.registrationCloseDate}
                disabled={submitting}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Maximum Participants"
                type="number"
                fullWidth
                value={maxParticipants === null ? '' : maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                error={!!formErrors.maxParticipants}
                helperText={formErrors.maxParticipants}
                disabled={submitting}
                inputProps={{ min: 1 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Scoring Type</InputLabel>
                <Select
                  value={scoringType}
                  onChange={(e) => setScoringType(e.target.value as ScoringType)}
                  label="Scoring Type"
                  disabled={submitting}
                >
                  <MenuItem value="gross">Gross</MenuItem>
                  <MenuItem value="net">Net</MenuItem>
                  <MenuItem value="both">Both (Gross & Net)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Series</InputLabel>
                <Select
                  value={selectedSeriesId}
                  onChange={(e) => {
                    setSelectedSeriesId(e.target.value);
                    setIsStandalone(!e.target.value);
                  }}
                  label="Series"
                  disabled={submitting}
                >
                  <MenuItem value="">
                    <em>None (Standalone Event)</em>
                  </MenuItem>
                  {allSeries.map((series) => (
                    <MenuItem key={series.id} value={series.id}>
                      {series.name}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Select a series to add this event to, or leave blank for a standalone event
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isStandalone}
                    onChange={(e) => {
                      setIsStandalone(e.target.checked);
                      if (e.target.checked) {
                        setSelectedSeriesId('');
                      }
                    }}
                    disabled={submitting}
                  />
                }
                label="This is a standalone event (not part of a series)"
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/admin/events')}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
} 