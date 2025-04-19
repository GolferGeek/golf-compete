"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { CoursesApiClient } from '@/lib/apiClient/courses';
import ScorecardEditor, { TeeSet, HoleData } from './scorecard/ScorecardEditor';

interface CourseHoleDetailsProps {
  courseId: string;
}

export default function CourseHoleDetails({ courseId }: CourseHoleDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);
  const [holes, setHoles] = useState<HoleData[]>([]);

  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course information using API client
      const courseResponse = await CoursesApiClient.getCourseById(courseId);

      if (!courseResponse.success || !courseResponse.data) {
        throw new Error('Failed to fetch course data');
      }

      // Fetch tee sets using API client
      const teeSetsResponse = await CoursesApiClient.getCourseTees(courseId);
      
      if (!teeSetsResponse.success) {
        throw new Error('Failed to fetch tee sets');
      }
      
      // Transform tee sets to match our component's expected format
      const formattedTeeSets = teeSetsResponse.data?.tees?.map(teeSet => ({
        id: teeSet.id,
        name: teeSet.teeName,
        color: teeSet.gender, // Use gender as color as a fallback
        rating: teeSet.courseRating,
        slope: teeSet.slopeRating
      })) || [];
      
      setTeeSets(formattedTeeSets);

      // Fetch holes using API client
      const holesResponse = await CoursesApiClient.getCourseHoles(courseId);
      
      if (!holesResponse.success) {
        throw new Error('Failed to fetch course holes');
      }
      
      // Transform the hole data to match our component's expected format
      const formattedHoles = holesResponse.data?.holes?.map(hole => ({
        id: hole.id,
        number: hole.holeNumber,
        par: hole.par,
        handicapIndex: hole.handicapIndex,
        notes: hole.notes || ''
      })) || [];
      
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
      // Update hole data using API client
      for (const hole of updatedHoles) {
        const originalHole = holes.find(h => h.id === hole.id);
        
        // Only update if something changed
        if (originalHole && (
          originalHole.par !== hole.par || 
          originalHole.handicapIndex !== hole.handicapIndex || 
          originalHole.notes !== hole.notes
        )) {
          await CoursesApiClient.updateCourseHole(courseId, hole.id, {
            par: hole.par,
            handicapIndex: hole.handicapIndex,
            notes: hole.notes || ''
          });
        }
      }
      
      // Refresh data
      await fetchCourseDetails();
    } catch (err) {
      console.error('Error saving scorecard:', err);
      throw err;
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