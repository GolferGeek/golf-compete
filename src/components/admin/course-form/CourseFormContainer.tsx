import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Stepper, Step, StepLabel, Alert, Snackbar, useTheme, useMediaQuery, StepContent, Paper, Typography, MobileStepper, Button } from '@mui/material';
import { supabase, refreshSchemaCache } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';

// Import step components
import CourseInfoStep from './steps/CourseInfoStep';
import TeeBoxesStep from './steps/TeeBoxesStep';
import ScorecardStep from './steps/ScorecardStep';
import ScorecardEditor, { HoleData } from '../scorecard/ScorecardEditor';
import ImageUploader from './components/ImageUploader';

// Types
import { CourseFormData, TeeSet, Hole } from './types';

interface CourseFormContainerProps {
  initialCourseId?: string;
  isEditMode?: boolean;
  initialStep?: number;
  isMobile?: boolean;
}

const CourseFormContainer: React.FC<CourseFormContainerProps> = ({
  initialCourseId,
  isEditMode = false,
  initialStep = 0,
  isMobile: propIsMobile
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const theme = useTheme();
  const detectedIsMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Use prop value if provided, otherwise use detected value
  const isMobile = propIsMobile !== undefined ? propIsMobile : detectedIsMobile;
  
  // Use a ref to store the courseId to ensure it's consistent across renders
  const courseIdRef = useRef<string | undefined>(initialCourseId);
  
  // Form state
  const [activeStep, setActiveStep] = useState(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Course data state
  const [courseId, setCourseId] = useState<string | undefined>(initialCourseId);
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    location: '',
    holes: 18,
    par: 72,
    amenities: '',
    website: '',
    phoneNumber: '',
    isActive: true
  });
  
  // Tee boxes and holes state
  const [teeBoxes, setTeeBoxes] = useState<TeeSet[]>([]);
  const [holes, setHoles] = useState<Hole[]>([]);
  
  // AI extraction state
  const [processingImage, setProcessingImage] = useState<boolean>(false);
  const [extractionStep, setExtractionStep] = useState<'course' | 'teeBoxes' | 'scorecard' | null>(null);
  
  // Steps definition
  const steps = ['Basic Course Information', 'Tee Boxes & Holes', 'Scorecard Data'];
  
  // Fetch course data when in edit mode
  useEffect(() => {
    if (isEditMode && initialCourseId) {
      fetchCourseData();
      // Set the courseId from initialCourseId to ensure it's available for all steps
      setCourseId(initialCourseId);
      courseIdRef.current = initialCourseId;
    }
  }, [isEditMode, initialCourseId]);
  
  // Fetch tee boxes and holes when navigating to step 1 or 2 in edit mode
  useEffect(() => {
    if (isEditMode && courseId) {
      if (activeStep === 1 || activeStep === 2) {
        console.log(`Fetching tee boxes and holes for step ${activeStep} with courseId:`, courseId);
        fetchTeeBoxesAndHoles(courseId);
      }
    }
  }, [activeStep, isEditMode, courseId]);
  
  // Ensure we have a courseId when on step 1
  useEffect(() => {
    if (activeStep === 1 && !courseId) {
      console.error('No course ID found on step 1 (Tee Boxes & Holes)');
      setError('Please save the course information first before adding tee boxes and holes.');
      setActiveStep(0);
    }
  }, [activeStep, courseId]);
  
  // Log courseId changes
  useEffect(() => {
    console.log('courseId changed:', courseId);
    
    // If we have a courseId and we're on step 1, fetch tee boxes and holes
    if (courseId && activeStep === 1) {
      console.log('Triggering fetchTeeBoxesAndHoles with courseId:', courseId);
      fetchTeeBoxesAndHoles(courseId);
    }
  }, [courseId]);
  
  // Update the ref whenever courseId changes
  useEffect(() => {
    if (courseId) {
      console.log('Updating courseIdRef from state:', courseId);
      courseIdRef.current = courseId;
    }
  }, [courseId]);
  
  // Set up event listener for saving tee boxes
  useEffect(() => {
    const handleSaveTeeBoxes = async () => {
      console.log('Save tee boxes event triggered');
      await saveTeeBoxes();
    };
    
    window.addEventListener('save-tee-boxes', handleSaveTeeBoxes);
    
    return () => {
      window.removeEventListener('save-tee-boxes', handleSaveTeeBoxes);
    };
  }, [teeBoxes, courseId]);
  
  // Fetch course data for edit mode
  const fetchCourseData = async () => {
    if (!isEditMode || !courseId) {
      return;
    }
    
    try {
      setLoading(true);
      
      const { data: courseData, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) {
        console.error('Error fetching course data:', error);
        setError(`Failed to load course data: ${error.message}`);
        return;
      }
      
      if (courseData) {
        // Type assertion to ensure TypeScript knows data has the expected properties
        const courseDataTyped = courseData as {
          name: string;
          location: string;
          holes: number;
          par: number;
          amenities: string | string[] | null;
          website: string | null;
          phone_number: string | null;
          is_active: boolean | null;
        };
        
        setFormData({
          name: courseDataTyped.name || '',
          location: courseDataTyped.location || '',
          holes: courseDataTyped.holes || 18,
          par: courseDataTyped.par || 72,
          amenities: courseDataTyped.amenities ? 
            (typeof courseDataTyped.amenities === 'string' ? 
              JSON.parse(courseDataTyped.amenities).join(', ') : 
              Array.isArray(courseDataTyped.amenities) ? 
                courseDataTyped.amenities.join(', ') : 
                String(courseDataTyped.amenities)) : 
            '',
          website: courseDataTyped.website || '',
          phoneNumber: courseDataTyped.phone_number || '',
          isActive: courseDataTyped.is_active !== null ? Boolean(courseDataTyped.is_active) : true
        });
      }
    } catch (err) {
      console.error('Exception in fetchCourseData:', err);
      if (err instanceof Error) {
        setError(`Failed to load course data: ${err.message}`);
      } else {
        setError('Failed to load course data due to an unknown error.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch tee boxes and holes for a course
  const fetchTeeBoxesAndHoles = async (idToUse?: string) => {
    // Use the provided ID or fall back to the state value
    const effectiveCourseId = idToUse || courseId;
    
    if (!effectiveCourseId) {
      console.error('Cannot fetch tee boxes and holes: No course ID');
      return;
    }
    
    try {
      console.log('Fetching tee sets and holes for course ID:', effectiveCourseId);
      console.log('Course ID type:', typeof effectiveCourseId);
      
      // Ensure we're using a valid string for the courseId
      const currentCourseId = String(effectiveCourseId);
      console.log('Using currentCourseId for fetch:', currentCourseId);
      
      // Fetch tee sets
      const { data: teeSetData, error: teeSetError } = await supabase
        .from('tee_sets')
        .select('*')
        .eq('course_id', currentCourseId);
        
      if (teeSetError) {
        console.error('Error fetching tee sets:', teeSetError);
        return;
      }
      
      console.log('Fetched tee sets:', teeSetData);
      
      // Fetch holes
      const { data: holeData, error: holeError } = await supabase
        .from('holes')
        .select('*')
        .eq('course_id', currentCourseId)
        .order('hole_number');
        
      if (holeError) {
        console.error('Error fetching holes:', holeError);
        return;
      }
      
      console.log('Fetched holes:', holeData);
      
      // Process tee sets to match our component's expected format
      const processedTeeSets: TeeSet[] = teeSetData?.map(teeSet => ({
        id: teeSet.id as string,
        name: teeSet.name as string,
        color: teeSet.color as string,
        rating: teeSet.rating as number || 0,
        slope: teeSet.slope as number || 0
      })) || [];
      
      // Process holes to match our component's expected format
      const processedHoles: Hole[] = holeData?.map(hole => ({
        id: hole.id as string,
        number: hole.hole_number as number,
        par: hole.par as number || 4,
        handicap_index: hole.handicap_index as number || 0,
        ...Object.fromEntries(
          (teeSetData || []).map(teeSet => [`length_${teeSet.id}`, 0])
        )
      })) || [];
      
      // Fetch tee set distances
      if (holeData && holeData.length > 0 && teeSetData && teeSetData.length > 0) {
        const { data: distanceData, error: distanceError } = await supabase
          .from('tee_set_lengths')
          .select('*')
          .in('hole_id', holeData.map(hole => hole.id));
          
        if (distanceError) {
          console.error('Error fetching tee set distances:', distanceError);
        } else if (distanceData) {
          // Update hole distances
          distanceData.forEach(distance => {
            const hole = processedHoles.find(h => h.id === distance.hole_id);
            if (hole) {
              // Check for both 'length' and 'distance' properties
              const distanceValue = 'length' in distance ? distance.length : 
                                   'distance' in distance ? distance.distance : 0;
              
              console.log(`Setting distance for hole ${hole.number}, tee ${distance.tee_set_id}: ${distanceValue}`);
              hole[`length_${distance.tee_set_id}`] = distanceValue;
            }
          });
        }
      }
      
      setTeeBoxes(processedTeeSets);
      setHoles(processedHoles);
      
      console.log('Processed tee sets:', processedTeeSets);
      console.log('Processed holes:', processedHoles);
    } catch (err) {
      console.error('Error fetching tee boxes and holes:', err);
    }
  };
  
  // Save tee boxes
  const saveTeeBoxes = async () => {
    // Use the ref for consistency
    const currentCourseId = courseIdRef.current;
    console.log('saveTeeBoxes called with courseIdRef:', currentCourseId);
    
    if (!currentCourseId) {
      console.error('No courseId available in saveTeeBoxes');
      setError('No course ID available. Please save the course information first.');
      return false;
    }
    
    try {
      setLoading(true);
      
      console.log('Saving tee boxes for course ID:', currentCourseId);
      console.log('Tee boxes to save:', teeBoxes);
      
      // Delete existing tee boxes first
      const { error: deleteError } = await supabase
        .from('tee_sets')
        .delete()
        .eq('course_id', currentCourseId);
      
      if (deleteError) {
        console.error('Error deleting existing tee boxes:', deleteError);
        throw deleteError;
      }
      
      // Only insert new tee boxes if there are any
      if (teeBoxes.length > 0) {
        // Add course_id to each tee box
        const teeBoxesWithCourseId = teeBoxes.map(teeBox => ({
          ...teeBox,
          course_id: currentCourseId
        }));
        
        console.log('Inserting tee boxes with course ID:', teeBoxesWithCourseId);
        
        const { error: insertError } = await supabase
          .from('tee_sets')
          .insert(teeBoxesWithCourseId);
        
        if (insertError) {
          console.error('Error inserting tee boxes:', insertError);
          throw insertError;
        }
      }
      
      console.log('Tee boxes saved successfully');
      return true;
    } catch (error) {
      console.error('Error in saveTeeBoxes:', error);
      setError(`Failed to save tee boxes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Save scorecard data
  const saveScorecard = async () => {
    // Use the ref for consistency
    const currentCourseId = courseIdRef.current;
    console.log('saveScorecard called with courseIdRef:', currentCourseId);
    console.log('Current holes state:', holes);
    
    if (!currentCourseId) {
      console.error('No courseId available in saveScorecard');
      setError('No course ID available. Please save the course information first.');
      return false;
    }
    
    if (!holes || holes.length === 0) {
      console.error('No holes data available to save');
      setError('No holes data available to save. Please add holes first.');
      return false;
    }
    
    try {
      setLoading(true);
      
      console.log('Saving scorecard for course ID:', currentCourseId);
      console.log('Holes to save:', holes);
      
      // Delete existing holes first
      const { error: deleteError } = await supabase
        .from('holes')
        .delete()
        .eq('course_id', currentCourseId);
      
      if (deleteError) {
        console.error('Error deleting existing holes:', deleteError);
        throw deleteError;
      }
      
      // Then insert the new holes
      if (holes.length > 0) {
        // Prepare holes data for insertion
        const holesData = holes.map(hole => {
          // Extract only the properties that exist in the database schema
          return {
            course_id: currentCourseId,
            hole_number: hole.number,
            par: hole.par,
            handicap_index: hole.handicap_index || null
          };
        });
        
        console.log('Inserting holes:', holesData);
        
        const { data: insertedHoles, error: insertError } = await supabase
          .from('holes')
          .insert(holesData)
          .select();
          
        if (insertError) {
          console.error('Error inserting holes:', insertError);
          setError(`Failed to save scorecard: ${insertError.message}`);
          return false;
        }
        
        console.log('Scorecard saved successfully:', insertedHoles);
        
        // Now insert the tee set distances
        if (insertedHoles && teeBoxes.length > 0) {
          // Prepare distances data for insertion
          const distancesData: { tee_set_id: string; hole_id: string; length: number }[] = [];
          
          for (const hole of holes) {
            for (const teeBox of teeBoxes) {
              const distanceKey = `length_${teeBox.id}`;
              const distance = hole[distanceKey];
              
              console.log(`Processing distance for hole ${hole.number}, tee ${teeBox.id}, key ${distanceKey}, value:`, distance);
              
              // Only add if distance is defined and not null
              if (distance !== undefined && distance !== null) {
                // Find the corresponding inserted hole
                const insertedHole = insertedHoles.find(h => h.hole_number === hole.number);
                
                if (insertedHole && insertedHole.id) {
                  distancesData.push({
                    tee_set_id: teeBox.id,
                    hole_id: insertedHole.id as string,
                    length: Number(distance)
                  });
                } else {
                  console.warn(`Could not find inserted hole for hole number ${hole.number}`);
                }
              }
            }
          }
          
          console.log('Inserting tee set distances:', distancesData);
          
          if (distancesData.length > 0) {
            // Refresh schema cache multiple times to ensure it's updated
            for (let i = 0; i < 3; i++) {
              console.log(`Refreshing schema cache attempt ${i + 1}`);
              await refreshSchemaCache();
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
            }
            
            // Insert distances for each tee box and hole
            const { data: insertedDistances, error: insertDistancesError } = await supabase
              .from('tee_set_lengths')
              .insert(distancesData)
              .select();
              
            if (insertDistancesError) {
              console.error('Error inserting tee set distances:', insertDistancesError);
              setError(`Failed to save tee set distances: ${insertDistancesError.message}`);
              return false;
            }
            
            console.log('Tee set distances saved successfully');
          } else {
            console.warn('No tee set distances to save');
          }
        }
        
        setSuccess(true);
        return true;
      }
      
      console.log('No holes to save');
      return false;
    } catch (error) {
      console.error('Error in saveScorecard:', error);
      setError(`Failed to save scorecard: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Try to refresh the schema cache multiple times with delays
      console.log('Attempting to refresh schema cache (attempt 1)');
      await refreshSchemaCache();
      
      // Wait a moment and try again
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Attempting to refresh schema cache (attempt 2)');
      await refreshSchemaCache();
      
      console.log('Submitting course data:', formData);
      console.log('Is course active?', formData.isActive);

      let savedCourseId: string | undefined = undefined;
      let schemaError = false;
      
      console.log('Starting handleSubmit with courseId:', courseId);
      console.log('Current courseIdRef:', courseIdRef.current);
      console.log('Form data:', formData);
      
      // If we already have a courseId in the ref, use that instead of creating a new one
      if (activeStep > 0 && courseIdRef.current) {
        console.log('Using existing courseId from ref:', courseIdRef.current);
        savedCourseId = courseIdRef.current;
        
        // Update the existing course
        try {
          console.log(`Updating course with ID: ${savedCourseId}`);
          
          // Prepare course data for Supabase
          const courseData = {
            name: formData.name,
            location: formData.location,
            par: formData.par,
            holes: formData.holes,
            amenities: formData.amenities,
            website: formData.website,
            phone_number: formData.phoneNumber,
            is_active: formData.isActive
          };
          
          const { error: updateError } = await supabase
            .from('courses')
            .update(courseData)
            .eq('id', savedCourseId);
            
          if (updateError) {
            console.error('Error updating course:', updateError);
            throw updateError;
          }
          
          console.log('Course updated successfully');
        } catch (updateError) {
          console.error('Error updating course:', updateError);
          // Continue with the flow even if update fails
        }
      } else {
        // Prepare course data for Supabase
        const courseData = {
          name: formData.name,
          location: formData.location,
          par: formData.par,
          holes: formData.holes,
          amenities: formData.amenities,
          website: formData.website,
          phone_number: formData.phoneNumber,
          is_active: formData.isActive
        };
        
        console.log('Prepared course data for save:', courseData);

        try {
          if (isEditMode && courseId) {
            // Update existing course
            console.log(`Updating course with ID: ${courseId}`);
            
            // Try using the PostgreSQL function first
            const { data: updatedCourse, error: rpcError } = await supabase.rpc(
              'update_course_with_active',
              {
                p_id: courseId,
                p_name: courseData.name,
                p_location: courseData.location,
                p_par: courseData.par,
                p_holes: courseData.holes,
                p_amenities: courseData.amenities,
                p_website: courseData.website,
                p_phone_number: courseData.phone_number,
                p_is_active: courseData.is_active
              }
            );
            
            if (rpcError) {
              console.error('Error updating course via RPC:', rpcError);
              
              // Fall back to the previous approach
              const { data: updatedCourse, error: updateError } = await supabase
                .from('courses')
                .update(courseData)
                .eq('id', courseId)
                .select();
              
              if (updateError) {
                console.error('Error updating course:', updateError);
                
                // If that fails, try updating without is_active first
                const courseDataWithoutActive = {
                  name: courseData.name,
                  location: courseData.location,
                  par: courseData.par,
                  holes: courseData.holes,
                  amenities: courseData.amenities,
                  website: courseData.website,
                  phone_number: courseData.phone_number
                };
                
                console.log('Trying update without is_active field:', courseDataWithoutActive);
                
                const { error: updateWithoutActiveError } = await supabase
                  .from('courses')
                  .update(courseDataWithoutActive)
                  .eq('id', courseId);
                  
                if (updateWithoutActiveError) {
                  console.error('Error updating course without is_active:', updateWithoutActiveError);
                  throw new Error(`Failed to update course: ${updateWithoutActiveError.message}`);
                }
                
                // Then try to update just the is_active field separately
                console.log('Now trying to update just the is_active field');
                const { error: activeUpdateError } = await supabase
                  .from('courses')
                  .update({ is_active: formData.isActive })
                  .eq('id', courseId);
                  
                if (activeUpdateError) {
                  console.error('Error updating is_active field:', activeUpdateError);
                  console.warn('Course was updated but the active status may not have been saved correctly');
                }
              }
              
              savedCourseId = courseId;
            } else {
              console.log('Course created successfully via RPC');
              savedCourseId = updatedCourse?.[0]?.id;
            }
          } else {
            // Create new course
            console.log('Creating new course');
            
            // Try using the PostgreSQL function first
            const { data: newCourse, error: rpcError } = await supabase.rpc(
              'insert_course_with_active',
              {
                p_name: courseData.name,
                p_location: courseData.location,
                p_par: courseData.par,
                p_holes: courseData.holes,
                p_amenities: courseData.amenities,
                p_website: courseData.website,
                p_phone_number: courseData.phone_number,
                p_is_active: courseData.is_active
              }
            );
            
            console.log('RPC call result:', newCourse);
            
            if (rpcError) {
              console.error('Error inserting course via RPC:', rpcError);
              
              // Check if this is a schema cache error
              if (rpcError.message && rpcError.message.includes('schema cache')) {
                schemaError = true;
                throw new Error(`Schema cache error: ${rpcError.message}`);
              }
            
              // Fall back to the previous approach
              const { data: newCourse, error: insertError } = await supabase
                .from('courses')
                .insert(courseData)
                .select();

              if (insertError) {
                console.error('Error inserting course:', insertError);
                
                // Check if this is a schema cache error
                if (insertError.message && insertError.message.includes('schema cache')) {
                  schemaError = true;
                  throw new Error(`Schema cache error: ${insertError.message}`);
                }
                
                // Try inserting without is_active field
                const courseDataWithoutActive = {
                  name: courseData.name,
                  location: courseData.location,
                  par: courseData.par,
                  holes: courseData.holes,
                  amenities: courseData.amenities,
                  website: courseData.website,
                  phone_number: courseData.phone_number
                };
                
                console.log('Trying insert without is_active field:', courseDataWithoutActive);
                
                const { data: insertedWithoutActive, error: insertWithoutActiveError } = await supabase
                  .from('courses')
                  .insert(courseDataWithoutActive)
                  .select();
                  
                if (insertWithoutActiveError) {
                  console.error('Error inserting course without is_active:', insertWithoutActiveError);
                  throw new Error(`Failed to create course: ${insertWithoutActiveError.message}`);
                }
                
                savedCourseId = insertedWithoutActive?.[0]?.id as string | undefined;
                console.log('Course created without is_active, ID:', savedCourseId);
                console.log('Inserted data:', insertedWithoutActive);
                
                // Then try to update just the is_active field separately
                if (savedCourseId) {
                  console.log('Now trying to update just the is_active field');
                  const { error: activeUpdateError } = await supabase
                    .from('courses')
                    .update({ is_active: formData.isActive })
                    .eq('id', savedCourseId);
                    
                  if (activeUpdateError) {
                    console.error('Error updating is_active field:', activeUpdateError);
                    console.warn('Course was created but the active status may not have been saved correctly');
                  }
                }
              } else {
                console.log('Course created successfully');
                savedCourseId = newCourse?.[0]?.id as string | undefined;
                console.log('Course created with ID:', savedCourseId);
                console.log('Inserted data:', newCourse);
              }
            } else {
              console.log('Course created successfully via RPC');
              // Extract the ID from the RPC result
              if (Array.isArray(newCourse) && newCourse.length > 0) {
                savedCourseId = newCourse[0].id as string | undefined;
                console.log('Extracted course ID from RPC result:', savedCourseId);
              } else {
                console.error('RPC returned success but no course data');
                console.log('RPC result type:', typeof newCourse);
                console.log('RPC result:', newCourse);
              }
            }
          }
        } catch (saveError) {
          console.error('Error saving course:', saveError);
          throw saveError;
        }
      }
      
      // Log the saved course ID
      console.log('Final saved course ID:', savedCourseId);
      console.log('Type of savedCourseId:', typeof savedCourseId);
      
      // Set the course ID in state and ref
      if (savedCourseId) {
        console.log('Setting courseId state to:', savedCourseId);
        setCourseId(savedCourseId);
        courseIdRef.current = savedCourseId;
        console.log('Updated courseIdRef to:', courseIdRef.current);
      } else {
        console.error('No savedCourseId available to set in state');
      }
      
      // Show success message
      setSuccess(true);
      
      // Redirect or reset form
      if (activeStep === 0) {
        // Move to the next step if we're on the first step
        console.log('Moving to step 1 (Tee Boxes & Holes) with courseId:', savedCourseId);
        console.log('courseIdRef:', courseIdRef.current);
        
        // We know we have a savedCourseId at this point, so we can safely move to the next step
        if (savedCourseId) {
          // Wait for the state to update before moving to the next step
          setTimeout(() => {
            // Fetch tee boxes with the savedCourseId directly
            if (!isEditMode) {
              console.log('Fetching tee boxes with savedCourseId:', savedCourseId);
              fetchTeeBoxesAndHoles(savedCourseId);
            }
            
            // Move to the next step
            console.log('Setting active step to 1');
            setActiveStep(1);
          }, 500);
        } else {
          console.error('No courseId available after saving course');
          console.error('savedCourseId:', savedCourseId);
          console.error('courseId state:', courseId);
          console.error('courseIdRef:', courseIdRef.current);
          setError('Failed to save course information. Please try again.');
        }
      } else if (activeStep === 1) {
        // Save tee boxes before moving to the scorecard step
        console.log('Saving tee boxes before moving to step 2 (Scorecard)');
        console.log('Current courseId before saving tee boxes:', courseId);
        console.log('Current courseIdRef before saving tee boxes:', courseIdRef.current);
        
        const teeBoxesSaved = await saveTeeBoxes();
        
        if (teeBoxesSaved) {
          console.log('Tee boxes saved successfully, moving to step 2');
          console.log('Current courseId after saving tee boxes:', courseId);
          console.log('Current courseIdRef after saving tee boxes:', courseIdRef.current);
          
          // Wait for any state updates to complete
          setTimeout(() => {
            setActiveStep(2);
          }, 500);
        } else {
          console.error('Failed to save tee boxes');
          setError('Failed to save tee boxes. Please try again.');
        }
      } else {
        // Save scorecard data before completing the form
        console.log('Saving scorecard data before completing the form');
        console.log('Current courseId before saving scorecard:', courseId);
        console.log('Current courseIdRef before saving scorecard:', courseIdRef.current);
        
        const scorecardSaved = await saveScorecard();
        
        if (scorecardSaved) {
          console.log('Scorecard saved successfully, redirecting to courses list');
          console.log('Final courseId:', courseId);
          console.log('Final courseIdRef:', courseIdRef.current);
          
          // Redirect after successful submission
          setTimeout(() => {
            router.push('/admin/courses');
          }, 1500);
        } else {
          console.error('Failed to save scorecard data');
          setError('Failed to save scorecard data. Please try again.');
        }
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        setError(`Failed to save course: ${err.message}`);
      } else {
        console.error('Unknown error type:', err);
        setError('Failed to save course due to an unknown error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Validate form data
  const validateForm = () => {
    if (!formData.name || !formData.location) {
      setError('Name and location are required fields');
      return false;
    }
    return true;
  };
  
  // Handle step navigation
  const handleNext = () => {
    const nextStep = activeStep + 1;
    
    // If we're in edit mode and moving to step 1 or 2, ensure we have the course data
    if (isEditMode && courseId) {
      if (nextStep === 1 || nextStep === 2) {
        console.log(`Moving to step ${nextStep} in edit mode with courseId:`, courseId);
        // The useEffect will handle fetching the data when activeStep changes
      }
    }
    
    setActiveStep(nextStep);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Get content for the current step
  const getStepContent = (step: number) => {
    // Handle scorecard data extraction from AI
    const handleScorecardDataExtracted = (extractedData: any) => {
      if (!extractedData || !Array.isArray(extractedData) || extractedData.length === 0) {
        console.error('Invalid scorecard data format:', extractedData);
        return;
      }
      
      try {
        // Create a map of tee colors to tee box IDs
        const teeColorMap = teeBoxes.reduce((map, teeBox) => {
          map[teeBox.color.toLowerCase()] = teeBox.id;
          return map;
        }, {} as Record<string, string>);
        
        // Update holes with extracted data
        const updatedHoles = [...holes];
        
        extractedData.forEach((holeData, index) => {
          if (index >= updatedHoles.length) return;
          
          // Update par and handicap index if available
          if (holeData.par) {
            updatedHoles[index].par = parseInt(holeData.par) || 4;
          }
          
          if (holeData.handicapIndex) {
            updatedHoles[index].handicap_index = parseInt(holeData.handicapIndex) || index + 1;
          }
          
          // Update distances for each tee color
          if (holeData.distances) {
            Object.entries(holeData.distances).forEach(([color, distance]) => {
              const normalizedColor = color.toLowerCase();
              const teeBoxId = teeColorMap[normalizedColor];
              
              if (teeBoxId) {
                updatedHoles[index][`length_${teeBoxId}`] = parseInt(distance as string) || 0;
              }
            });
          }
        });
        
        setHoles(updatedHoles);
      } catch (error) {
        console.error('Error processing extracted scorecard data:', error);
      }
    };
    
    switch (step) {
      case 0:
        return (
          <CourseInfoStep
            formData={formData}
            setFormData={setFormData}
            loading={loading}
            handleSubmit={handleSubmit}
            isEditMode={isEditMode}
            processingImage={processingImage}
            setProcessingImage={setProcessingImage}
            extractionStep={extractionStep}
            setExtractionStep={setExtractionStep}
            router={router}
            courseId={courseId}
            isMobile={isMobile}
          />
        );
      case 1:
        return (
          <TeeBoxesStep
            courseId={courseId || ''}
            teeBoxes={teeBoxes}
            setTeeBoxes={setTeeBoxes}
            holes={holes}
            setHoles={setHoles}
            handleNext={handleNext}
            handleBack={handleBack}
            saveTeeBoxes={saveTeeBoxes}
            loading={loading}
            processingImage={processingImage}
            setProcessingImage={setProcessingImage}
            extractionStep={extractionStep}
            setExtractionStep={setExtractionStep}
            isMobile={isMobile}
          />
        );
      case 2:
        // If we don't have any holes, generate default ones
        if (!holes || holes.length === 0) {
          console.log('No holes found, generating default holes');
          
          // Generate default holes (18 holes)
          const defaultHoles: Hole[] = Array.from({ length: 18 }, (_, i) => ({
            number: i + 1,
            par: 4,
            handicap_index: i + 1,
            ...Object.fromEntries(
              teeBoxes.map(teeBox => [`length_${teeBox.id}`, 0])
            )
          }));
          
          // Update the holes state
          setHoles(defaultHoles);
          console.log('Generated default holes:', defaultHoles);
        }
        
        // Convert holes to the format expected by ScorecardEditor
        const formattedHoles: HoleData[] = holes.map(hole => {
          // Create distances object for each hole
          const distances: Record<string, number> = {};
          
          // Add distances for each tee set
          teeBoxes.forEach(teeSet => {
            const distanceKey = `length_${teeSet.id}`;
            if (hole[distanceKey] !== undefined) {
              distances[teeSet.id] = Number(hole[distanceKey]);
            }
          });
          
          return {
            id: hole.id,
            number: hole.number,
            par: hole.par,
            handicapIndex: hole.handicap_index,
            distances
          };
        });
        
        return (
          <Box sx={{ p: 2 }}>
            {/* AI-Assisted Data Extraction */}
            <ImageUploader
              step="scorecard"
              processingImage={processingImage}
              setProcessingImage={setProcessingImage}
              extractionStep={extractionStep}
              setExtractionStep={setExtractionStep}
              onDataExtracted={handleScorecardDataExtracted}
              isMobile={isMobile}
            />
            
            <ScorecardEditor
              courseId={courseId || ''}
              teeSets={teeBoxes}
              holes={formattedHoles}
              onSave={async (updatedHoles) => {
                // Convert back to the format expected by the form
                console.log('ScorecardEditor onSave called with updatedHoles:', updatedHoles);
                
                const convertedHoles: Hole[] = updatedHoles.map(hole => {
                  const newHole: Hole = {
                    id: hole.id,
                    number: hole.number,
                    par: hole.par,
                    handicap_index: hole.handicapIndex
                  };
                  
                  // Add distances for each tee set
                  Object.entries(hole.distances).forEach(([teeSetId, distance]) => {
                    newHole[`length_${teeSetId}`] = distance;
                  });
                  
                  return newHole;
                });
                
                console.log('Converted holes for saving:', convertedHoles);
                
                // Update the holes state
                setHoles(convertedHoles);
                
                // Save the scorecard data
                try {
                  const saveResult = await saveScorecard();
                  console.log('saveScorecard result:', saveResult);
                  
                  if (saveResult) {
                    // Redirect to courses list after successful save
                    router.push('/admin/courses');
                  } else {
                    console.error('saveScorecard returned false');
                  }
                } catch (error) {
                  console.error('Error saving scorecard:', error);
                }
              }}
              onCancel={handleBack}
              loading={loading}
              startInEditMode={true}
            />
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              mt: 4 
            }}>
              <Button 
                onClick={handleBack} 
                disabled={loading}
              >
                Back
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => router.push('/admin/courses')}
                disabled={loading}
              >
                Exit Without Saving
              </Button>
            </Box>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  // Render mobile or desktop stepper based on screen size
  const renderStepper = () => {
    if (isMobile) {
      return (
        <Box sx={{ width: '100%', mb: 3 }}>
          <Paper square elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
            <Typography variant="h6">{steps[activeStep]}</Typography>
          </Paper>
          
          {getStepContent(activeStep)}
          
          <MobileStepper
            variant="dots"
            steps={steps.length}
            position="static"
            activeStep={activeStep}
            sx={{ mt: 3, bgcolor: 'background.default' }}
            nextButton={
              <Button
                size="small"
                onClick={handleNext}
                disabled={activeStep === steps.length - 1 || loading}
              >
                Next
                <KeyboardArrowRight />
              </Button>
            }
            backButton={
              <Button 
                size="small" 
                onClick={handleBack} 
                disabled={activeStep === 0 || loading}
              >
                <KeyboardArrowLeft />
                Back
              </Button>
            }
          />
        </Box>
      );
    }
    
    return (
      <Box sx={{ width: '100%' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
      </Box>
    );
  };

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
        message="Course saved successfully"
      />
      
      {renderStepper()}
    </Box>
  );
};

export default CourseFormContainer; 