'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import HandicapDisplay from '@/components/handicap/HandicapDisplay';

interface StartRoundProps {
  eventId?: string;
  initialCourseId?: string;
  initialTeeSetId?: string;
  initialDate?: string;
}

interface Course {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

interface TeeSet {
  id: string;
  name: string;
  color?: string;
  men_rating?: number;
  women_rating?: number;
  men_slope?: number;
  women_slope?: number;
}

interface Bag {
  id: string;
  name: string;
  description?: string;
  handicap?: number;
  is_default: boolean;
}

export default function StartRound({ 
  eventId, 
  initialCourseId, 
  initialTeeSetId, 
  initialDate 
}: StartRoundProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  // Form state
  const [courses, setCourses] = useState<Course[]>([]);
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);
  const [bags, setBags] = useState<Bag[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [selectedCourse, setSelectedCourse] = useState(initialCourseId || '');
  const [selectedTeeSet, setSelectedTeeSet] = useState(initialTeeSetId || '');
  const [selectedBag, setSelectedBag] = useState('');
  const [roundDate, setRoundDate] = useState<Date>(
    initialDate ? new Date(initialDate) : new Date()
  );
  const [weatherConditions, setWeatherConditions] = useState('');
  const [courseConditions, setCourseConditions] = useState('');
  const [temperature, setTemperature] = useState<number | ''>('');
  const [windConditions, setWindConditions] = useState('');
  const [notes, setNotes] = useState('');

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        const supabase = createClient();

        // Load courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('id, name, city, state')
          .eq('is_active', true)
          .order('name');

        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        // Load bags
        const { data: bagsData, error: bagsError } = await supabase
          .from('bags')
          .select('id, name, description, handicap, is_default')
          .eq('user_id', user.id)
          .order('name');

        if (bagsError) throw bagsError;
        setBags(bagsData || []);

        // Set default bag if none selected
        const defaultBag = bagsData?.find(bag => bag.is_default);
        if (defaultBag && !selectedBag) {
          setSelectedBag(defaultBag.id);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load course and bag data');
        setLoading(false);
      }
    };

    loadData();
  }, [user, selectedBag]);

  // Load tee sets when course changes
  useEffect(() => {
    const loadTeeSets = async () => {
      if (!selectedCourse) {
        setTeeSets([]);
        return;
      }

      try {
        const supabase = createClient();
        const { data: teeSetsData, error: teeSetsError } = await supabase
          .from('course_tees')
          .select('id, name, color, men_rating, women_rating, men_slope, women_slope')
          .eq('course_id', selectedCourse)
          .order('name');

        if (teeSetsError) throw teeSetsError;
        setTeeSets(teeSetsData || []);

        // Auto-select first tee set if none selected
        if (teeSetsData && teeSetsData.length > 0 && !selectedTeeSet) {
          setSelectedTeeSet(teeSetsData[0].id);
        }
      } catch (error) {
        console.error('Error loading tee sets:', error);
        setError('Failed to load tee sets');
      }
    };

    loadTeeSets();
  }, [selectedCourse, selectedTeeSet]);

  const handleStartRound = async () => {
    if (!user || !selectedCourse || !selectedTeeSet) {
      setError('Please select a course and tee set');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Create the round
      const { data: round, error: roundError } = await supabase
        .from('rounds')
        .insert({
          user_id: user.id,
          course_id: selectedCourse,
          course_tee_id: selectedTeeSet,
          bag_id: selectedBag || null,
          round_date: roundDate.toISOString(),
          weather_conditions: weatherConditions || null,
          course_conditions: courseConditions || null,
          temperature: temperature || null,
          wind_conditions: windConditions || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (roundError) throw roundError;

      // Navigate to the active round page
      router.push(`/rounds/${round.id}/play`);
    } catch (error) {
      console.error('Error starting round:', error);
      setError('Failed to start round. Please try again.');
      setSubmitting(false);
    }
  };

  const selectedCourseData = courses.find(course => course.id === selectedCourse);
  const selectedTeeSetData = teeSets.find(tee => tee.id === selectedTeeSet);
  const selectedBagData = bags.find(bag => bag.id === selectedBag);

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Start New Round
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ p: 4 }}>
          <Grid container spacing={3}>
            {/* Course Selection */}
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Course</InputLabel>
                <Select
                  value={selectedCourse}
                  label="Course"
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                      {course.city && course.state && ` - ${course.city}, ${course.state}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Tee Set Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required disabled={!selectedCourse}>
                <InputLabel>Tee Set</InputLabel>
                <Select
                  value={selectedTeeSet}
                  label="Tee Set"
                  onChange={(e) => setSelectedTeeSet(e.target.value)}
                >
                  {teeSets.map((teeSet) => (
                    <MenuItem key={teeSet.id} value={teeSet.id}>
                      {teeSet.name}
                      {teeSet.color && ` (${teeSet.color})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Bag Selection */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Bag</InputLabel>
                <Select
                  value={selectedBag}
                  label="Bag"
                  onChange={(e) => setSelectedBag(e.target.value)}
                >
                  {bags.map((bag) => (
                    <MenuItem key={bag.id} value={bag.id}>
                      {bag.name}
                      {bag.handicap && ` (Handicap: ${bag.handicap})`}
                      {bag.is_default && ' (Default)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Round Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Round Date"
                type="date"
                value={format(roundDate, 'yyyy-MM-dd')}
                onChange={(e) => setRoundDate(new Date(e.target.value))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Weather Conditions */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Weather Conditions"
                value={weatherConditions}
                onChange={(e) => setWeatherConditions(e.target.value)}
                placeholder="e.g., Sunny, Partly Cloudy"
              />
            </Grid>

            {/* Course Conditions */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Course Conditions"
                value={courseConditions}
                onChange={(e) => setCourseConditions(e.target.value)}
                placeholder="e.g., Dry, Wet, Cart Path Only"
              />
            </Grid>

            {/* Temperature */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Temperature (°F)"
                type="number"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : '')}
                inputProps={{ min: 0, max: 120 }}
              />
            </Grid>

            {/* Wind Conditions */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Wind Conditions"
                value={windConditions}
                onChange={(e) => setWindConditions(e.target.value)}
                placeholder="e.g., Light breeze, Strong crosswind"
              />
            </Grid>

            {/* Notes */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Pre-Round Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any thoughts or goals for this round..."
              />
            </Grid>
          </Grid>

          {/* Summary Card */}
          {selectedCourseData && selectedTeeSetData && (
            <Card sx={{ mt: 3, bgcolor: 'primary.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Round Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Course
                    </Typography>
                    <Typography variant="body1">
                      {selectedCourseData.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tee Set
                    </Typography>
                    <Typography variant="body1">
                      {selectedTeeSetData.name}
                      {selectedTeeSetData.men_rating && 
                        ` (Rating: ${selectedTeeSetData.men_rating}, Slope: ${selectedTeeSetData.men_slope})`
                      }
                    </Typography>
                  </Grid>
                  {selectedBagData && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Bag
                      </Typography>
                      <Typography variant="body1">
                        {selectedBagData.name}
                        {selectedBagData.handicap && ` (Handicap: ${selectedBagData.handicap})`}
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Date
                    </Typography>
                    <Typography variant="body1">
                      {format(roundDate, 'MMMM d, yyyy')}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Handicap and Expected Score Display */}
          {selectedBag && selectedTeeSet && (
            <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
              <CardContent>
                <HandicapDisplay
                  userId={user.id}
                  bagId={selectedBag}
                  courseRating={teeSets.find(t => t.id === selectedTeeSet)?.men_rating}
                  slopeRating={teeSets.find(t => t.id === selectedTeeSet)?.men_slope}
                  showExpectedScore={true}
                  variant="detailed"
                />
              </CardContent>
            </Card>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleStartRound}
              disabled={!selectedCourse || !selectedTeeSet || submitting}
              sx={{ flex: 1 }}
            >
              {submitting ? 'Starting Round...' : 'Start Round'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
} 