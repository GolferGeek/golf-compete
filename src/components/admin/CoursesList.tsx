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
              setFilteredCourses(coursesWithActive as unknown as Course[]);
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
          setFilteredCourses(data as unknown as Course[]);
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
      (course.location && course.location.toLowerCase().includes(query))
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
          <Grid container spacing={2}>
            {filteredCourses.map((course) => (
              <Grid item xs={12} key={course.id}>
                <Card sx={{ 
                  width: '100%',
                  position: 'relative',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      {/* Course Information */}
                      <Box sx={{ flex: 1, pr: 1 }}>
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="h6" component="div" sx={{ fontWeight: 500 }}>
                            {course.name}
                          </Typography>
                          <Chip 
                            label={course.is_active ? 'Active' : 'Inactive'} 
                            color={course.is_active ? 'success' : 'default'} 
                            size="small"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        
                        <Stack spacing={0.5} sx={{ mb: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOnIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {course.location || 'No location specified'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <GolfCourseIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {course.holes || '18'} Holes
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FlagIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Par {course.par || '72'}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                      
                      {/* Action Buttons - Vertical on right side */}
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center',
                        gap: 0.5,
                        ml: 1,
                        borderLeft: 1,
                        borderColor: 'divider',
                        pl: 1
                      }}>
                        <Tooltip title="Edit Course">
                          <IconButton 
                            component={Link} 
                            href={`/admin/courses/edit/${course.id}`}
                            aria-label="edit"
                            size="small"
                            color="primary"
                          >
                            <EditIcon />
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
                              <CircularProgress size={20} />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
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