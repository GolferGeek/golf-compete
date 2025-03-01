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
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Course } from '@/types/golf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function CoursesList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
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
        
        const { data, error } = await supabase
          .from('courses')
          .select('*');
        
        if (error) {
          console.error('Error fetching courses:', error);
          
          // Handle authentication errors
          if (error.code === 'PGRST301' || error.code === '401') {
            setError('Your session has expired. Please log in again.');
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
        const { error } = await supabase
          .from('courses')
          .delete()
          .eq('id', id);
        
        if (error) {
          // Handle authentication errors
          if (error.code === 'PGRST301' || error.code === '401') {
            setError('Your session has expired. Please log in again.');
          } else {
            alert('Failed to delete course. Please try again.');
          }
          
          throw error;
        }
        
        // Remove the deleted course from state
        setCourses(courses.filter(course => course.id !== id));
      } catch (err) {
        console.error('Error deleting course:', err);
        // Error is already handled above
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
            <TableCell>Rating</TableCell>
            <TableCell>Slope</TableCell>
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
              <TableCell>{course.rating}</TableCell>
              <TableCell>{course.slope}</TableCell>
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
                  >
                    <DeleteIcon />
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