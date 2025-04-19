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
import { Event, EventFormat, ScoringType, EventStatus } from '@/types/events';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, refreshSchemaCache } from '@/lib/supabase';
import { CoursesApiClient } from '@/lib/apiClient/courses';

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
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>(undefined);
  const [scoringType, setScoringType] = useState<ScoringType>('gross');
  const [isStandalone, setIsStandalone] = useState(!seriesId);

  useEffect(() => {
    async function loadCourses() {
      try {
        console.log('Loading courses...');
        
        // Try to refresh the schema cache first
        await refreshSchemaCache();
        
        // Load courses using the API client instead of direct Supabase call
        const coursesResponse = await CoursesApiClient.getCourses();
        
        if (!coursesResponse.success) {
          console.error('Error loading courses:', coursesResponse.error);
          throw new Error(coursesResponse.error?.message || 'Failed to fetch courses');
        }
        
        console.log('Active courses data received:', coursesResponse.data);
        
        // Type cast the data to Course[]
        const typedData = (coursesResponse.data?.courses || []).map(item => ({
          id: String(item.id),
          name: String(item.name),
          location: item.city && item.state ? `${item.city}, ${item.state}` : '',
          isActive: true // Default to true as API may not have this field
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
          setMaxParticipants(eventData.max_participants as number | undefined);
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

    if (maxParticipants !== undefined && maxParticipants <= 0) {
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

    try {
      setSubmitting(true);
      setError(null);

      const eventData = {
        name,
        description,
        event_date: eventDate?.toISOString() || new Date().toISOString(),
        registration_close_date: registrationCloseDate?.toISOString(),
        course_id: courseId,
        event_format: eventFormat,
        max_participants: maxParticipants,
        scoring_type: scoringType,
        is_standalone: isStandalone,
        series_id: !isStandalone ? selectedSeriesId : null,
        created_by: user?.id,
        is_active: true,
        status: 'upcoming' as EventStatus
      };

      let savedEvent;
      if (isEditMode) {
        savedEvent = await updateEvent(eventId, eventData);
      } else {
        savedEvent = await createEvent(eventData);
      }

      if (savedEvent) {
        // If this event is part of a series, redirect to the series events page
        if (!isStandalone && selectedSeriesId) {
          router.push(`/series/${selectedSeriesId}/events`);
        } else {
          // Otherwise, redirect to the events list or dashboard
          router.push('/events');
        }
      }
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Failed to save event. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return format(date, 'yyyy-MM-dd');
  };

  const parseInputDate = (dateString: string) => {
    if (!dateString) return null;
    return parseISO(dateString);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Event Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!formErrors.name}
              helperText={formErrors.name}
              required
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
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Event Date"
              type="date"
              value={formatDateForInput(eventDate)}
              onChange={(e) => setEventDate(parseInputDate(e.target.value))}
              error={!!formErrors.eventDate}
              helperText={formErrors.eventDate}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Registration Close Date"
              type="date"
              value={formatDateForInput(registrationCloseDate)}
              onChange={(e) => setRegistrationCloseDate(parseInputDate(e.target.value))}
              error={!!formErrors.registrationCloseDate}
              helperText={formErrors.registrationCloseDate}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!formErrors.courseId} required>
              <InputLabel id="course-select-label">Course</InputLabel>
              <Select
                labelId="course-select-label"
                value={courseId}
                label="Course"
                onChange={(e) => setCourseId(e.target.value)}
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
            <FormControl fullWidth>
              <InputLabel id="format-select-label">Event Format</InputLabel>
              <Select
                labelId="format-select-label"
                value={eventFormat}
                label="Event Format"
                onChange={(e) => setEventFormat(e.target.value as EventFormat)}
              >
                <MenuItem value="stroke_play">Stroke Play</MenuItem>
                <MenuItem value="match_play">Match Play</MenuItem>
                <MenuItem value="stableford">Stableford</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="scoring-type-select-label">Scoring Type</InputLabel>
              <Select
                labelId="scoring-type-select-label"
                value={scoringType}
                label="Scoring Type"
                onChange={(e) => setScoringType(e.target.value as ScoringType)}
              >
                <MenuItem value="gross">Gross</MenuItem>
                <MenuItem value="net">Net</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Maximum Participants"
              type="number"
              value={maxParticipants || ''}
              onChange={(e) => setMaxParticipants(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              error={!!formErrors.maxParticipants}
              helperText={formErrors.maxParticipants}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {!seriesId && (
            <>
              <Grid item xs={12}>
                <Divider />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={!isStandalone}
                      onChange={(e) => setIsStandalone(!e.target.checked)}
                    />
                  }
                  label="Add to Series"
                />
              </Grid>

              {!isStandalone && (
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="series-select-label">Series</InputLabel>
                    <Select
                      labelId="series-select-label"
                      value={selectedSeriesId}
                      label="Series"
                      onChange={(e) => setSelectedSeriesId(e.target.value)}
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
            </>
          )}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : isEditMode ? 'Update Event' : 'Create Event'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
} 