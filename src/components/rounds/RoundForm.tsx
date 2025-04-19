"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  FormHelperText,
  Divider,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { 
  WeatherCondition, 
  CourseCondition, 
  CreateRoundInput,
  EventRoundSummary 
} from '@/types/round';
import { createRound, getEventRounds } from '@/services/roundService';
import { format } from 'date-fns';
import { getEventById } from '@/lib/events';
import { CoursesApiClient } from '@/lib/apiClient/courses';

interface RoundFormProps {
  eventId?: string;
  initialCourseId?: string;
  initialTeeSetId?: string;
  initialDate?: string;
}

interface Course {
  id: string;
  name: string;
  city: string;
  state: string;
  par: number;
  holes: number;
  is_active: boolean;
}

interface TeeSet {
  id: string;
  name: string;
  color: string;
  rating: number;
  slope: number;
}

interface Bag {
  id: string;
  name: string;
  description?: string;
}

interface EventData {
  id: string;
  course_id: string;
  event_date: string;
  name: string;
  courses?: {
    name: string;
    city: string;
    state: string;
  };
  tee_set_id?: string;
}

// Add date formatting helpers
const formatDateForInput = (date: string | null) => {
  if (!date) return '';
  return format(new Date(date), 'yyyy-MM-dd');
};

const parseInputDate = (dateString: string) => {
  if (!dateString) return undefined;
  return new Date(dateString).toISOString();
};

export default function RoundForm({ eventId, initialCourseId, initialTeeSetId, initialDate }: RoundFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  console.log('RoundForm Props:', { eventId, initialCourseId, initialTeeSetId, initialDate });
  
  // Form state
  const [courses, setCourses] = useState<Course[]>([]);
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [eventRounds, setEventRounds] = useState<EventRoundSummary | null>(null);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<Partial<CreateRoundInput>>({
    event_id: eventId,
    course_id: initialCourseId || '',
    tee_set_id: initialTeeSetId || '',
    date_played: initialDate || new Date().toISOString(),
    weather_conditions: [],
    course_conditions: [],
  });

  console.log('Initial Form Data:', formData);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        // Load bags for the current user
        // TODO: Replace with BagsApiClient once implemented
        const { data: bagsData, error: bagsError } = await supabase
          .from('bags')
          .select('id, name, description')
          .eq('user_id', user.id)
          .order('name');
        
        if (bagsError) throw new Error('Failed to load bags');
        setBags(bagsData as Bag[] || []);

        // If this is an event round, load event data
        if (eventId) {
          console.log('Loading event data for ID:', eventId);
          const eventData = await getEventById(eventId);
          console.log('Loaded Event Data:', eventData);
          
          if (eventData) {
            setEvent(eventData);

            // Load course data using the API client
            const courseResponse = await CoursesApiClient.getCourseById(eventData.course_id, true);
            
            console.log('Loaded Course Data:', courseResponse);
            if (courseResponse.success && courseResponse.data) {
              // Map the course data to match the expected structure
              const courseData = {
                id: courseResponse.data.id,
                name: courseResponse.data.name,
                city: courseResponse.data.city || '',
                state: courseResponse.data.state || '',
                par: 72, // Default values as they might not be in API response
                holes: 18, // Default values as they might not be in API response
                is_active: true
              };
              setCourses([courseData as Course]);
              
              // Set tee sets from the course response if available
              if (courseResponse.data.tees && courseResponse.data.tees.length > 0) {
                // Map to match the expected structure
                const teeSetData = courseResponse.data.tees.map(tee => ({
                  id: tee.id,
                  name: tee.teeName,
                  color: '', // This might be missing in API, default to empty
                  rating: tee.courseRating,
                  slope: tee.slopeRating
                }));
                setTeeSets(teeSetData as TeeSet[]);
              } else {
                // Fallback to fetching tee sets using the API client
                const teeSetsResponse = await CoursesApiClient.getCourseTees(eventData.course_id);
                
                if (teeSetsResponse.success && teeSetsResponse.data?.tees) {
                  const mappedTeeSets = teeSetsResponse.data.tees.map(tee => ({
                    id: tee.id,
                    name: tee.teeName,
                    color: '', // This might be missing in API, default to empty
                    rating: tee.courseRating,
                    slope: tee.slopeRating
                  }));
                  setTeeSets(mappedTeeSets as TeeSet[]);
                } else {
                  console.error('Failed to load tee sets from API');
                }
              }
            }

            const updatedFormData = {
              ...formData,
              event_id: eventId,
              course_id: eventData.course_id,
              date_played: eventData.event_date,
              tee_set_id: initialTeeSetId || ''
            };
            console.log('Updating Form Data:', updatedFormData);
            setFormData(updatedFormData);

            const eventRoundsData = await getEventRounds(eventId);
            setEventRounds(eventRoundsData);
          }
        } else {
          // For solo rounds, load courses using the API client
          const coursesResponse = await CoursesApiClient.getCourses();
          
          if (!coursesResponse.success) {
            throw new Error('Failed to load courses');
          }
          
          // Map the courses to match the expected structure
          const mappedCourses = coursesResponse.data?.courses.map(course => ({
            id: course.id,
            name: course.name,
            city: course.city || '',
            state: course.state || '',
            par: 72, // Default value
            holes: 18, // Default value
            is_active: true
          })) || [];
          
          setCourses(mappedCourses as Course[]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error in loadData:', error);
        setError('Failed to load necessary data. Please try refreshing the page.');
        setLoading(false);
      }
    };

    loadData();
  }, [user, eventId, router, initialCourseId, initialTeeSetId, initialDate]);

  // Load tee sets for solo rounds
  useEffect(() => {
    const loadTeeSets = async () => {
      // Only load tee sets for solo rounds when course changes
      if (!eventId && formData.course_id) {
        // Use API client to fetch tee sets
        const teeSetsResponse = await CoursesApiClient.getCourseTees(formData.course_id);
        
        if (!teeSetsResponse.success) {
          setError('Failed to load tee sets');
          return;
        }

        // Map the tee sets to match the expected structure
        const mappedTeeSets = teeSetsResponse.data?.tees.map(tee => ({
          id: tee.id,
          name: tee.teeName,
          color: '', // This might be missing in API, default to empty
          rating: tee.courseRating,
          slope: tee.slopeRating
        })) || [];
        
        setTeeSets(mappedTeeSets as TeeSet[]);
      }
    };

    loadTeeSets();
  }, [formData.course_id, eventId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setFormErrors({});

    try {
      // Validate required fields
      const errors: Record<string, string> = {};
      if (!formData.course_id) errors.course_id = 'Course is required';
      if (!formData.tee_set_id) errors.tee_set_id = 'Tee set is required';
      if (bags.length > 0 && !formData.bag_id) errors.bag_id = 'Bag is required';
      
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setSubmitting(false);
        return;
      }

      // Create the round
      const round = await createRound(formData as CreateRoundInput);
      
      // Redirect based on event presence
      if (eventId) {
        router.push(`/events/${eventId}/scoring`);
      } else {
        router.push(`/rounds/${round.id}/score`);
      }
    } catch (error) {
      console.error('Error creating round:', error);
      setError('Failed to create round');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      {eventRounds && (
        <Paper sx={{ mb: 4, p: 2 }}>
          <Typography variant="h6" gutterBottom>Event Rounds</Typography>
          <Grid container spacing={2}>
            {eventRounds.rounds.map((round) => (
              <Grid item xs={12} key={round.round_id}>
                <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle1">{round.user_name}</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <Typography variant="body2">Score: {round.total_score}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">Putts: {round.total_putts}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">Fairways: {round.fairways_hit}</Typography>
                    </Grid>
                    <Grid item xs={3}>
                      <Typography variant="body2">GIR: {round.greens_in_regulation}</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {eventId ? 'Enter Event Round' : 'Enter New Round'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {!eventId ? (
              // Course selection only for solo rounds
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.course_id} size="small">
                  <InputLabel>Course</InputLabel>
                  <Select
                    value={formData.course_id || ''}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    label="Course"
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.name} - {course.city}, {course.state}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.course_id && (
                    <FormHelperText>{formErrors.course_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            ) : (
              // For event rounds, show course info as text
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Course"
                  value={event?.courses ? `${event.courses.name} - ${event.courses.city}, ${event.courses.state}` : ''}
                  disabled
                  fullWidth
                  size="small"
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.tee_set_id} size="small">
                <InputLabel>Tee Set</InputLabel>
                <Select
                  value={formData.tee_set_id || ''}
                  onChange={(e) => setFormData({ ...formData, tee_set_id: e.target.value })}
                  label="Tee Set"
                  disabled={!formData.course_id}
                >
                  {teeSets.map((teeSet) => (
                    <MenuItem key={teeSet.id} value={teeSet.id}>
                      {teeSet.name} - {teeSet.color} ({teeSet.rating}/{teeSet.slope})
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.tee_set_id && (
                  <FormHelperText>{formErrors.tee_set_id}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Only show bag selection if user has bags */}
            {bags.length > 0 && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!formErrors.bag_id} size="small">
                  <InputLabel>Bag</InputLabel>
                  <Select
                    value={formData.bag_id || ''}
                    onChange={(e) => setFormData({ ...formData, bag_id: e.target.value })}
                    label="Bag"
                  >
                    {bags.map((bag) => (
                      <MenuItem key={bag.id} value={bag.id}>
                        {bag.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.bag_id && (
                    <FormHelperText>{formErrors.bag_id}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                label="Date Played"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.date_played ? formatDateForInput(formData.date_played) : ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  date_played: parseInputDate(e.target.value)
                })}
                size="small"
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Weather Conditions</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(['sunny', 'partly_cloudy', 'cloudy', 'light_rain', 'heavy_rain', 'windy'] as WeatherCondition[]).map((condition) => (
                  <Chip
                    key={condition}
                    label={condition.replace('_', ' ')}
                    onClick={() => {
                      const conditions = formData.weather_conditions || [];
                      const newConditions = conditions.includes(condition)
                        ? conditions.filter(c => c !== condition)
                        : [...conditions, condition];
                      setFormData({ ...formData, weather_conditions: newConditions });
                    }}
                    color={formData.weather_conditions?.includes(condition) ? 'primary' : 'default'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Course Conditions</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {(['dry', 'wet', 'cart_path_only', 'frost_delay'] as CourseCondition[]).map((condition) => (
                  <Chip
                    key={condition}
                    label={condition.replace('_', ' ')}
                    onClick={() => {
                      const conditions = formData.course_conditions || [];
                      const newConditions = conditions.includes(condition)
                        ? conditions.filter(c => c !== condition)
                        : [...conditions, condition];
                      setFormData({ ...formData, course_conditions: newConditions });
                    }}
                    color={formData.course_conditions?.includes(condition) ? 'primary' : 'default'}
                    sx={{ textTransform: 'capitalize' }}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                size="small"
              />
            </Grid>

            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
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
                color="primary"
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : 'Continue to Score Entry'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
} 