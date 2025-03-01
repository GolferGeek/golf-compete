"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { supabaseClient } from '@/lib/auth';

interface CourseHoleDetailsProps {
  courseId: string;
}

interface TeeSet {
  id: string;
  name: string;
  color: string;
  rating: number;
  slope: number;
}

interface HoleData {
  id: string;
  holeNumber: number;
  par: number;
  handicapIndex: number;
}

export default function CourseHoleDetails({ courseId }: CourseHoleDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);
  const [holes, setHoles] = useState<HoleData[]>([]);
  const [distances, setDistances] = useState<Record<string, Record<string, number>>>({});
  const [editMode, setEditMode] = useState(false);

  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course information
      const { data: courseData, error: courseError } = await supabaseClient
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      // Fetch tee sets
      const { data: teeSetData, error: teeSetError } = await supabaseClient
        .from('tee_sets')
        .select('*')
        .eq('courseId', courseId)
        .order('name');

      if (teeSetError) throw teeSetError;
      setTeeSets(teeSetData || []);

      // Fetch holes
      const { data: holeData, error: holeError } = await supabaseClient
        .from('holes')
        .select('*')
        .eq('courseId', courseId)
        .order('holeNumber');

      if (holeError) throw holeError;
      
      // Helper function to create default holes
      const createDefaultHoles = async (numHoles: number) => {
        try {
          const holeData = Array.from({ length: numHoles }, (_, i) => ({
            courseId,
            holeNumber: i + 1,
            par: 4, // Default par
            handicapIndex: i + 1
          }));

          const { error } = await supabaseClient
            .from('holes')
            .insert(holeData);

          if (error) throw error;
        } catch (err) {
          console.error('Error creating default holes:', err);
          throw err;
        }
      };
      
      // If no holes exist yet, create them
      if (!holeData || holeData.length === 0) {
        await createDefaultHoles(courseData.holes);
        
        // Fetch the newly created holes
        const { data: newHoleData, error: newHoleError } = await supabaseClient
          .from('holes')
          .select('*')
          .eq('courseId', courseId)
          .order('holeNumber');
          
        if (newHoleError) throw newHoleError;
        setHoles(newHoleData || []);
      } else {
        setHoles(holeData);
      }

      // Fetch distances if holes exist
      if (holes.length > 0 && teeSetData && teeSetData.length > 0) {
        const distanceMap: Record<string, Record<string, number>> = {};
        
        // Initialize the distance map
        holes.forEach(hole => {
          distanceMap[hole.id] = {};
        });

        // Fetch all distances
        const { data: distanceData, error: distanceError } = await supabaseClient
          .from('tee_set_distances')
          .select('*')
          .in('holeId', holes.map(h => h.id));

        if (distanceError) throw distanceError;

        // Populate the distance map
        if (distanceData) {
          distanceData.forEach(distance => {
            if (distanceMap[distance.holeId]) {
              distanceMap[distance.holeId][distance.teeSetId] = distance.distance;
            }
          });
        }

        setDistances(distanceMap);
      }
    } catch (err) {
      console.error('Error fetching course details:', err);
      setError('Failed to load course details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [courseId, holes]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  const handleDistanceChange = (holeId: string, teeSetId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    setDistances(prev => ({
      ...prev,
      [holeId]: {
        ...prev[holeId],
        [teeSetId]: numValue
      }
    }));
  };

  const handleParChange = (index: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    setHoles(prev => {
      const newHoles = [...prev];
      newHoles[index] = {
        ...newHoles[index],
        par: numValue
      };
      return newHoles;
    });
  };

  const handleHandicapChange = (index: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    setHoles(prev => {
      const newHoles = [...prev];
      newHoles[index] = {
        ...newHoles[index],
        handicapIndex: numValue
      };
      return newHoles;
    });
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      // Update holes
      for (const hole of holes) {
        await supabaseClient
          .from('holes')
          .update({
            par: hole.par,
            handicapIndex: hole.handicapIndex
          })
          .eq('id', hole.id);
      }

      // Update distances
      for (const holeId in distances) {
        for (const teeSetId in distances[holeId]) {
          const distance = distances[holeId][teeSetId];
          
          // Check if the distance already exists
          const { data: existingDistance } = await supabaseClient
            .from('tee_set_distances')
            .select('*')
            .eq('holeId', holeId)
            .eq('teeSetId', teeSetId)
            .maybeSingle();

          if (existingDistance) {
            // Update existing distance
            await supabaseClient
              .from('tee_set_distances')
              .update({ distance })
              .eq('id', existingDistance.id);
          } else {
            // Insert new distance
            await supabaseClient
              .from('tee_set_distances')
              .insert({
                holeId,
                teeSetId,
                distance
              });
          }
        }
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setEditMode(false);
    } catch (err) {
      console.error('Error saving changes:', err);
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Hole Details</Typography>
        {!editMode ? (
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setEditMode(true)}
          >
            Edit Holes
          </Button>
        ) : (
          <Box>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={() => {
                setEditMode(false);
                fetchCourseDetails(); // Reload original data
              }}
              sx={{ mr: 1 }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={saveChanges}
              disabled={saving}
            >
              {saving ? <CircularProgress size={24} /> : 'Save Changes'}
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Changes saved successfully!
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Hole</TableCell>
              <TableCell>Par</TableCell>
              <TableCell>Handicap</TableCell>
              {teeSets.map(teeSet => (
                <TableCell key={teeSet.id} align="center">
                  {teeSet.name} ({teeSet.color})
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {holes.map((hole, index) => (
              <TableRow key={hole.id}>
                <TableCell>{hole.holeNumber}</TableCell>
                <TableCell>
                  {editMode ? (
                    <TextField
                      type="number"
                      value={hole.par}
                      onChange={(e) => handleParChange(index, e.target.value)}
                      InputProps={{ inputProps: { min: 3, max: 5 } }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  ) : (
                    hole.par
                  )}
                </TableCell>
                <TableCell>
                  {editMode ? (
                    <TextField
                      type="number"
                      value={hole.handicapIndex || ''}
                      onChange={(e) => handleHandicapChange(index, e.target.value)}
                      InputProps={{ inputProps: { min: 1, max: 18 } }}
                      size="small"
                      sx={{ width: 60 }}
                    />
                  ) : (
                    hole.handicapIndex || 'N/A'
                  )}
                </TableCell>
                {teeSets.map(teeSet => (
                  <TableCell key={teeSet.id} align="center">
                    {editMode ? (
                      <TextField
                        type="number"
                        value={distances[hole.id]?.[teeSet.id] || ''}
                        onChange={(e) => handleDistanceChange(hole.id, teeSet.id, e.target.value)}
                        InputProps={{ inputProps: { min: 100, max: 999 } }}
                        size="small"
                        sx={{ width: 70 }}
                      />
                    ) : (
                      distances[hole.id]?.[teeSet.id] || 'N/A'
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {/* Totals row */}
            <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
              <TableCell><strong>Total</strong></TableCell>
              <TableCell>
                <strong>
                  {holes.reduce((sum, hole) => sum + (hole.par || 0), 0)}
                </strong>
              </TableCell>
              <TableCell>-</TableCell>
              {teeSets.map(teeSet => (
                <TableCell key={teeSet.id} align="center">
                  <strong>
                    {holes.reduce((sum, hole) => sum + (distances[hole.id]?.[teeSet.id] || 0), 0)}
                  </strong>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
} 