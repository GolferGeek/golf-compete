"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  Chip,
  Card,
  CardContent,
  Grid,
  useMediaQuery,
  useTheme,
  Stack,
  Divider,
  TextField,
  InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import Link from 'next/link';
import { supabase, refreshSchemaCache } from '@/lib/supabase';
import { Course } from '@/types/golf';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GolfCourseIcon from '@mui/icons-material/GolfCourse';
import FlagIcon from '@mui/icons-material/Flag';
import { CoursesApiClient } from '@/lib/apiClient/courses';

export default function CoursesList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [shouldMaintainFocus, setShouldMaintainFocus] = useState(false);
  const { session } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
        
        // Fetch courses using the API client
        const response = await CoursesApiClient.getCourses();
        
        console.log('Raw API response:', response);
        
        if (!response.success) {
          console.error('Error fetching courses:', response.error);
          
          if (response.error?.code === 'UNAUTHORIZED') {
            setError('Your session has expired. Please log in again.');
          } else {
            setError('Failed to load courses. Please try again later.');
          }
          
          throw new Error(response.error?.message || 'Failed to fetch courses');
        }
        
        // Safely handle the data
        console.log('Response data:', response.data);
        console.log('Courses from response:', response.data?.courses);
        
        if (response.data?.courses) {
          // Map the courses to match the expected structure
          const mappedCourses = response.data.courses.map(course => {
            console.log('Processing course:', course);
            return {
              id: course.id,
              name: course.name,
              city: course.city || '',
              state: course.state || '',
              website: course.website || '',
              phone_number: course.phoneNumber || '',
              is_active: course.isActive === false ? false : true,
              par: course.par || 72,
              holes: course.holes || 18,
              tees: [],
              amenities: course.amenities ? 
                (typeof course.amenities === 'string' ? 
                  (course.amenities.startsWith('[') ? JSON.parse(course.amenities) : [course.amenities]) 
                  : (Array.isArray(course.amenities) ? course.amenities : []))
                : []
            };
          }) as Course[];
          
          console.log('Mapped courses:', mappedCourses);
          setCourses(mappedCourses);
          setFilteredCourses(mappedCourses);
        } else {
          setCourses([]);
          setFilteredCourses([]);
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

  // Filter courses based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCourses(courses);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = courses.filter(course => 
      (course.name && course.name.toLowerCase().includes(query)) || 
      (course.city && course.city.toLowerCase().includes(query)) ||
      (course.state && course.state.toLowerCase().includes(query))
    );
    
    setFilteredCourses(filtered);
  }, [searchQuery, courses]);

  // Maintain focus on search input after state updates
  useEffect(() => {
    if (shouldMaintainFocus) {
      // Use a more direct approach to focus the input element
      const focusInput = () => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      };
      
      // Only use a delayed focus to prevent infinite loops
      // Remove the immediate focus call that might be causing issues
      const timerId = setTimeout(focusInput, 50);
      
      // Reset the flag immediately to prevent infinite loops
      setShouldMaintainFocus(false);
      return () => clearTimeout(timerId);
    }
  }, [shouldMaintainFocus]);

  const handleDelete = async (id: string) => {
    // Ensure user is authenticated
    if (!session) {
      setError('You must be logged in to delete courses. Please log in and try again.');
      return;
    }
    
    if (confirm('Are you sure you want to delete this course?')) {
      try {
        setDeleteLoading(id);
        
        // Delete course using the API client
        const response = await CoursesApiClient.deleteCourse(id);
        
        if (!response.success) {
          console.error('Error deleting course:', response.error);
          
          if (response.error?.code === 'UNAUTHORIZED') {
            setError('Your session has expired. Please log in again.');
          } else {
            alert(`Failed to delete course: ${response.error?.message || 'Unknown error'}`);
          }
          
          setDeleteLoading(null);
          return;
        }
        
        // Remove the deleted course from state
        setCourses(courses.filter(course => course.id !== id));
        setFilteredCourses(filteredCourses.filter(course => course.id !== id));
        setDeleteLoading(null);
      } catch (err) {
        console.error('Error deleting course:', err);
        setDeleteLoading(null);
        alert('An unexpected error occurred. Please try again.');
      }
    }
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setSearchQuery(newValue);
    
    // Only set focus flag if we're actually changing the value
    if (searchQuery !== newValue) {
      setShouldMaintainFocus(true);
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('');
    setShouldMaintainFocus(true);
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

  // Search bar component
  const SearchBar = () => (
    <Box sx={{ mb: 3, width: '100%' }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search courses by name or location..."
        value={searchQuery}
        onChange={handleSearchChange}
        inputRef={searchInputRef}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: searchQuery ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="clear search"
                onClick={handleClearSearch}
                edge="end"
                size="small"
                onMouseDown={(e) => {
                  // Prevent the TextField from losing focus
                  e.preventDefault();
                }}
              >
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
          sx: { borderRadius: 2 }
        }}
      />
    </Box>
  );

  if (courses.length === 0) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>No courses found. Add your first course to get started.</Typography>
      </Box>
    );
  }

  // Mobile view - card-based layout
  if (isMobile) {
    return (
      <Box sx={{ width: '100%' }}>
        <SearchBar />
        
        {filteredCourses.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>No courses match your search. Try a different term.</Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%' }}>
            {filteredCourses.map((course) => (
              <Box key={course.id} sx={{ width: '100%', mb: 1 }}>
                <Card sx={{ 
                  width: '100%',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {/* Course Information */}
                      <Box sx={{ flex: 1, pr: 1 }}>
                        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                          {course.name}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 0.5 }}>
                          {course.city && course.state && (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <LocationOnIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                              <Typography variant="body2" color="text.secondary" noWrap>
                                {course.city}, {course.state}
                              </Typography>
                            </Box>
                          )}
                          
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <GolfCourseIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                            <Typography variant="body2" color="text.secondary">
                              {course.holes || '18'} Holes • Par {course.par || '72'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Action Buttons - Horizontal on right side */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 0.5,
                        ml: 1,
                      }}>
                        <Tooltip title="Edit Course">
                          <IconButton 
                            component={Link} 
                            href={`/admin/courses/edit/${course.id}`}
                            aria-label="edit"
                            size="small"
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Course">
                          <IconButton 
                            onClick={() => handleDelete(course.id)}
                            aria-label="delete"
                            disabled={deleteLoading === course.id}
                            size="small"
                            color="error"
                          >
                            {deleteLoading === course.id ? (
                              <CircularProgress size={16} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  // Desktop view - table layout
  return (
    <Box sx={{ width: '100%' }}>
      <SearchBar />
      
      {filteredCourses.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography>No courses match your search. Try a different term.</Typography>
        </Box>
      ) : (
        <TableContainer>
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
              {filteredCourses.map((course) => (
                <TableRow key={course.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {course.name}
                  </TableCell>
                  <TableCell>{course.city && course.state ? `${course.city}, ${course.state}` : 'No location specified'}</TableCell>
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
      )}
    </Box>
  );
} 