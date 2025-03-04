"use client";

import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  IconButton, 
  Typography,
  CircularProgress,
  Box,
  Tooltip,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';
import { supabase, refreshSchemaCache } from '@/lib/supabase';
import { Course } from '@/types/golf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function CoursesList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        
        // Check if we have a session
        if (!session) {
          console.error('No session found when trying to fetch courses');
          setError('You must be logged in to view courses. Please log in and try again.');
          setLoading(false);
          return;
        }
        
        // Try to refresh the schema cache first
        await refreshSchemaCache();
        
        const { data, error } = await supabase
          .from('courses')
          .select('*');
        
        if (error) {
          console.error('Error fetching courses:', error);
          
          // Handle authentication errors
          if (error.code === 'PGRST301' || error.code === '401') {
            setError('Your session has expired. Please log in again.');
          } else if (error.code === '42703' && error.message.includes('is_active')) {
            // Handle missing is_active column
            console.warn('is_active column not found, trying to fetch without it');
            
            // Try again without relying on is_active
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('courses')
              .select('id, name, location, holes, par, amenities, website, phone_number');
              
            if (fallbackError) {
              console.error('Error in fallback fetch:', fallbackError);
              setError('Failed to load courses. Please try again later.');
              throw fallbackError;
            }
            
            // Add is_active = true to all courses as a fallback
            if (fallbackData) {
              const coursesWithActive = fallbackData.map(course => ({
                ...course,
                is_active: true
              }));
              setCourses(coursesWithActive as unknown as Course[]);
              setLoading(false);
              return;
            }
          } else {
            setError('Failed to load courses. Please try again later.');
          }
          
          throw error;
        }
        
        // Safely handle the data
        if (data) {
          // Convert to unknown first, then to Course[] to satisfy TypeScript
          setCourses(data as unknown as Course[]);
        } else {
          setCourses([]);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        // Error is already set above
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [session]);

  const handleDelete = async (id: string) => {
    // Ensure user is authenticated
    if (!session) {
      setError('You must be logged in to delete courses. Please log in and try again.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        setDeleteLoading(id);
        
        // First, check if there are any tee sets associated with this course
        const { data: teeSets, error: teeSetError } = await supabase
          .from('tee_sets')
          .select('id')
          .eq('course_id', id);
          
        if (teeSetError) {
          console.error('Error checking for tee sets:', teeSetError);
          alert('Failed to check for associated tee sets. Please try again.');
          setDeleteLoading(null);
          return;
        }
        
        // If there are tee sets, delete them first
        if (teeSets && teeSets.length > 0) {
          console.log(`Deleting ${teeSets.length} tee sets for course ${id}`);
          
          const { error: deleteTeeSetsError } = await supabase
            .from('tee_sets')
            .delete()
            .eq('course_id', id);
            
          if (deleteTeeSetsError) {
            console.error('Error deleting tee sets:', deleteTeeSetsError);
            alert('Failed to delete associated tee sets. Please try again.');
            setDeleteLoading(null);
            return;
          }
          
          console.log('Successfully deleted associated tee sets');
        }
        
        // Now delete the course
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', id);
        
        if (error) {
          // Handle authentication errors
          if (error.code === 'PGRST301' || error.code === '401') {
            setError('Your session has expired. Please log in again.');
          } else {
            console.error('Error deleting course:', error);
            alert(`Failed to delete course: ${error.message}`);
          }
          
          setDeleteLoading(null);
          return;
        }
        
        // Remove the deleted course from state
        setCourses(courses.filter(course => course.id !== id));
        setDeleteLoading(null);
      } catch (err) {
        console.error('Error deleting course:', err);
        setDeleteLoading(null);
        alert('An unexpected error occurred. Please try again.');
      }
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
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (courses.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No courses found. Add your first course to get started.</Typography>
      </Box>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="courses table">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Holes</TableCell>
            <TableCell>Par</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
              <TableCell component="th" scope="row">
                {course.name}
              </TableCell>
              <TableCell>{course.location}</TableCell>
              <TableCell>{course.holes}</TableCell>
              <TableCell>{course.par}</TableCell>
              <TableCell>
                <Chip 
                  label={course.is_active ? 'Active' : 'Inactive'} 
                  color={course.is_active ? 'success' : 'default'} 
                  size="small" 
                />
              </TableCell>
              <TableCell align="right">
                <Tooltip title="View Course Details">
                  <IconButton 
                    component={Link} 
                    href={`/admin/courses/${course.id}`}
                    aria-label="view"
                    sx={{ mr: 1 }}
                  >
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Course">
                  <IconButton 
                    component={Link} 
                    href={`/admin/courses/edit/${course.id}`}
                    aria-label="edit"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Course">
                  <IconButton 
                    onClick={() => handleDelete(course.id)}
                    aria-label="delete"
                    disabled={deleteLoading === course.id}
                  >
                    {deleteLoading === course.id ? (
                      <CircularProgress size={24} />
                    ) : (
                      <DeleteIcon />
                    )}
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
} 