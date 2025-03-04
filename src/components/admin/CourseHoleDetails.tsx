"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { supabaseClient } from '@/lib/auth';
import ScorecardEditor, { TeeSet, HoleData } from './scorecard/ScorecardEditor';

interface CourseHoleDetailsProps {
  courseId: string;
}

export default function CourseHoleDetails({ courseId }: CourseHoleDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);
  const [holes, setHoles] = useState<HoleData[]>([]);
  const [teeSetDistances, setTeeSetDistances] = useState<{
    id?: string;
    hole_id: string;
    tee_set_id: string;
    length: number;
  }[]>([]);

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
        .eq('course_id', courseId)
        .order('name');

      if (teeSetError) throw teeSetError;
      
      // Transform tee sets to match our component's expected format
      const formattedTeeSets = teeSetData?.map(teeSet => ({
        id: teeSet.id,
        name: teeSet.name,
        color: teeSet.color,
        rating: teeSet.rating,
        slope: teeSet.slope
      })) || [];
      
      setTeeSets(formattedTeeSets);

      // Fetch holes
      const { data: holeData, error: holeError } = await supabaseClient
        .from('holes')
        .select('*')
        .eq('course_id', courseId)
        .order('hole_number');

      if (holeError) throw holeError;
      
      // Fetch all distances
      const { data: distanceData, error: distanceError } = await supabaseClient
        .from('tee_set_lengths')
        .select('*')
        .in('hole_id', holeData?.map(h => h.id) || []);

      if (distanceError) throw distanceError;
      
      // Create a map of distances
      const distanceMap: Record<string, Record<string, number>> = {};
      
      // Initialize the distance map
      holeData?.forEach(hole => {
        distanceMap[hole.id] = {};
      });
      
      // Populate the distance map
      distanceData?.forEach(distance => {
        if (distanceMap[distance.hole_id]) {
          distanceMap[distance.hole_id][distance.tee_set_id] = distance.length;
        }
      });
      
      // Transform the hole data to match our component's expected format
      const formattedHoles = holeData?.map(hole => {
        // Create distances object for this hole
        const distances: Record<string, number> = {};
        
        // Add each tee set with its distance (or 0 if not found)
        formattedTeeSets.forEach(teeSet => {
          distances[teeSet.id] = distanceMap[hole.id]?.[teeSet.id] || 0;
        });
        
        return {
          id: hole.id,
          number: hole.hole_number,
          par: hole.par,
          handicapIndex: hole.handicap_index,
          distances: distances
        };
      }) || [];
      
      setHoles(formattedHoles);
    } catch (err) {
      console.error('Error fetching course details:', err);
      setError('Failed to load course details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseDetails();
  }, [fetchCourseDetails]);

  const handleSaveScorecard = async (updatedHoles: HoleData[]) => {
    try {
      // Update holes
      for (const hole of updatedHoles) {
        await supabaseClient
          .from('holes')
          .update({
            par: hole.par,
            handicap_index: hole.handicapIndex
          })
          .eq('id', hole.id);
      }

      // Update distances
      for (const hole of updatedHoles) {
        for (const teeSetId in hole.distances) {
          const distance = hole.distances[teeSetId];
          
          // Check if the distance already exists
          const { data: existingDistance } = await supabaseClient
            .from('tee_set_lengths')
            .select('*')
            .eq('hole_id', hole.id)
            .eq('tee_set_id', teeSetId)
            .maybeSingle();

          if (existingDistance) {
            // Update existing distance
            await supabaseClient
              .from('tee_set_lengths')
              .update({ length: distance })
              .eq('id', existingDistance.id);
          } else {
            // Insert new distance
            await supabaseClient
              .from('tee_set_lengths')
              .insert({
                hole_id: hole.id,
                tee_set_id: teeSetId,
                length: distance
              });
          }
        }
      }
      
      // Refresh data
      await fetchCourseDetails();
    } catch (err) {
      console.error('Error saving scorecard:', err);
      throw err;
    }
  };

  const fetchTeeSetDistances = async () => {
    if (!courseId || !holes || holes.length === 0 || !teeSets || teeSets.length === 0) return;
    
    const { data, error } = await supabaseClient
      .from('tee_set_lengths')
      .select('*')
      .in('hole_id', holes.map(hole => hole.id));
    
    if (error) {
      console.error('Error fetching tee set distances:', error);
      return;
    }
    
    if (data) {
      setTeeSetDistances(data);
    }
  };

  const handleDistanceChange = async (holeId: string, teeSetId: string, newValue: number) => {
    // Update the local state
    setTeeSetDistances(prev => 
      prev.map(dist => 
        dist.hole_id === holeId && dist.tee_set_id === teeSetId 
          ? { ...dist, length: newValue } 
          : dist
      )
    );
    
    // Update in the database
    const { error } = await supabaseClient
      .from('tee_set_lengths')
      .update({ length: newValue })
      .match({ hole_id: holeId, tee_set_id: teeSetId });
    
    if (error) {
      console.error('Error updating distance:', error);
      // Revert the change in local state if there was an error
      fetchTeeSetDistances();
    }
  };

  const handleAddDistance = async (holeId: string, teeSetId: string, value: number) => {
    const { data, error } = await supabaseClient
      .from('tee_set_lengths')
      .insert({
        hole_id: holeId,
        tee_set_id: teeSetId,
        length: value
      })
      .select();
    
    if (error) {
      console.error('Error adding distance:', error);
      return;
    }
    
    if (data) {
      setTeeSetDistances(prev => [...prev, ...data]);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <ScorecardEditor
      courseId={courseId}
      teeSets={teeSets}
      holes={holes}
      onSave={handleSaveScorecard}
      loading={loading}
    />
  );
} 