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
import { supabaseClient } from '@/lib/auth';
import { Course } from '@/types/golf';
import VisibilityIcon from '@mui/icons-material/Visibility';

export default function CoursesList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        
        // During development, allow anyone to view courses
        const { data, error } = await supabaseClient
          .from('courses')
          .select('*');
        
        if (error) throw error;
        
        setCourses(data || []);
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  const handleDelete = async (id: string) => {
    // For development, allow anyone to delete courses
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        const { error } = await supabaseClient
          .from('courses')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
        
        // Remove the deleted course from state
        setCourses(courses.filter(course => course.id !== id));
      } catch (err) {
        console.error('Error deleting course:', err);
        alert('Failed to delete course. Please try again.');
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