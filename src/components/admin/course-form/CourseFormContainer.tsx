import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Stepper, Step, StepLabel, Alert, Snackbar } from '@mui/material';
import { supabase, refreshSchemaCache } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';

// Import step components
import CourseInfoStep from './steps/CourseInfoStep';
import TeeBoxesStep from './steps/TeeBoxesStep';
import ScorecardStep from './steps/ScorecardStep';

// Types
import { CourseFormData, TeeSet, Hole } from './types';

interface CourseFormContainerProps {
  initialCourseId?: string;
  isEditMode?: boolean;
  initialStep?: number;
}

const CourseFormContainer: React.FC<CourseFormContainerProps> = ({
  initialCourseId,
  isEditMode = false,
  initialStep = 0
}) => {
  const router = useRouter();
  const { user } = useAuth();
  
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
  const [processingImage, setProcessingImage] = useState(false);
  const [extractionStep, setExtractionStep] = useState<'course' | 'teeBoxes' | 'scorecard' | null>(null);
  
  // Steps definition
  const steps = ['Basic Course Information', 'Tee Boxes & Holes', 'Scorecard Data'];
  
  // Fetch course data when in edit mode
  useEffect(() => {
    if (isEditMode && initialCourseId) {
      fetchCourseData();
    }
  }, [isEditMode, initialCourseId]);
  
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
          .from('tee_set_distances')
          .select('*')
          .in('hole_id', holeData.map(hole => hole.id));
          
        if (distanceError) {
          console.error('Error fetching tee set distances:', distanceError);
        } else if (distanceData) {
          // Update hole distances
          distanceData.forEach(distance => {
            const hole = processedHoles.find(h => h.id === distance.hole_id);
            if (hole) {
              hole[`length_${distance.tee_set_id}`] = distance.length;
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
    
    if (!currentCourseId) {
      console.error('No courseId available in saveScorecard');
      setError('No course ID available. Please save the course information first.');
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
          const distancesData: { tee_set_id: string; hole_id: string; distance: number }[] = [];
          
          for (const hole of holes) {
            for (const teeBox of teeBoxes) {
              const distanceKey = `length_${teeBox.id}`;
              const distance = hole[distanceKey];
              
              if (distance) {
                // Find the corresponding inserted hole
                const insertedHole = insertedHoles.find(h => h.hole_number === hole.number);
                
                if (insertedHole && insertedHole.id) {
                  distancesData.push({
                    tee_set_id: teeBox.id,
                    hole_id: insertedHole.id as string,
                    distance: Number(distance)
                  });
                }
              }
            }
          }
          
          if (distancesData.length > 0) {
            console.log('Inserting tee set distances:', distancesData);
            
            const { error: distancesError } = await supabase
              .from('tee_set_distances')
              .insert(distancesData);
              
            if (distancesError) {
              console.error('Error inserting tee set distances:', distancesError);
              setError(`Failed to save tee set distances: ${distancesError.message}`);
              return false;
            }
            
            console.log('Tee set distances saved successfully');
          }
        }
        
        return true;
      }
      
      console.log('No holes to save');
      return true;
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
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  return (
    <Box>
      {success && (
        <Snackbar 
          open={success} 
          autoHideDuration={6000} 
          onClose={() => setSuccess(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity="success" sx={{ width: '100%' }}>
            {activeStep === 0 && extractionStep === 'course' 
              ? 'Course information extracted successfully! Review and click "Save and Continue" when ready.'
              : isEditMode 
                ? 'Course updated successfully!' 
                : 'Course created successfully!'}
          </Alert>
        </Snackbar>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {activeStep === 0 ? (
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
        />
      ) : activeStep === 1 ? (
        <TeeBoxesStep 
          courseId={courseId}
          teeBoxes={teeBoxes}
          setTeeBoxes={setTeeBoxes}
          holes={holes}
          setHoles={setHoles}
          handleNext={handleNext}
          handleBack={handleBack}
          loading={loading}
          processingImage={processingImage}
          setProcessingImage={setProcessingImage}
          extractionStep={extractionStep}
          setExtractionStep={setExtractionStep}
        />
      ) : (
        <ScorecardStep 
          courseId={courseId}
          teeBoxes={teeBoxes}
          holes={holes}
          setHoles={setHoles}
          handleSubmit={handleSubmit}
          handleBack={handleBack}
          loading={loading}
          processingImage={processingImage}
          setProcessingImage={setProcessingImage}
          extractionStep={extractionStep}
          setExtractionStep={setExtractionStep}
        />
      )}
    </Box>
  );
};

export default CourseFormContainer; 