import React, { useState, useEffect, useRef, TouchEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Stepper, Step, StepLabel, Alert, Snackbar, useTheme, useMediaQuery, StepContent, Paper, Typography, MobileStepper, Button } from '@mui/material';
import { supabase, refreshSchemaCache } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { CoursesApiClient, CreateCoursePayload, UpdateCoursePayload, CreateCourseTeePayload, CreateHolePayload } from '@/lib/apiClient/courses';

// Import step components
import CourseInfoStep from './steps/CourseInfoStep';
import TeeBoxesStep from './steps/TeeBoxesStep';
import ScorecardStep from './steps/ScorecardStep';
import ScorecardEditor, { HoleData } from '../scorecard/ScorecardEditor';
import ImageUploader from './components/ImageUploader';

// Types
import { CourseFormData, TeeSet, Hole, ExtractedCourseData } from './types';

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Course data state
  const [courseId, setCourseId] = useState<string | undefined>(initialCourseId);
  const [formData, setFormData] = useState<CourseFormData>({
    name: '',
    address: '',
    city: '',
    state: '',
    country: 'USA',
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
  
  // Track if data has been edited by user
  const [teesHaveBeenSaved, setTeesHaveBeenSaved] = useState(false);
  
  // AI extraction state
  const [processingImage, setProcessingImage] = useState<boolean>(false);
  const [extractionStep, setExtractionStep] = useState<'course' | 'teeBoxes' | 'scorecard' | null>(null);
  
  // Store full extracted data from AI
  const [extractedCourseData, setExtractedCourseData] = useState<ExtractedCourseData | undefined>(undefined);
  
  // Steps definition
  const steps = ['Basic Course Information', 'Tee Boxes & Holes', 'Scorecard Data'];
  
  // Touch state
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  
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
      
      const response = await CoursesApiClient.getCourseById(courseId);
      
      if (!response.success || !response.data) {
        console.error('Error fetching course data:', response.error);
        setError(`Failed to load course data: ${response.error?.message || 'Unknown error'}`);
        return;
      }
      
      const courseData = response.data;
      
      if (courseData) {
        setFormData({
          name: courseData.name || '',
          address: courseData.address || '',
          city: courseData.city || '',
          state: courseData.state || '',
          country: courseData.country || 'USA',
          holes: courseData.holes || 18,
          par: courseData.par || 72,
          amenities: courseData.amenities ? 
            (typeof courseData.amenities === 'string' ? 
              JSON.parse(courseData.amenities).join(', ') : 
              Array.isArray(courseData.amenities) ? 
                courseData.amenities.join(', ') : 
                String(courseData.amenities)) : 
            '',
          website: courseData.website || '',
          phoneNumber: courseData.phone_number || '',
          isActive: courseData.isActive !== null ? Boolean(courseData.isActive) : true
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
      
      // Ensure we're using a valid string for the courseId
      const currentCourseId = String(effectiveCourseId);
      
      // Use API clients instead of direct Supabase calls
      
      // Fetch tee sets
      const teeResponse = await CoursesApiClient.getCourseTees(currentCourseId);
      if (!teeResponse.success) {
        console.error('Error fetching tee sets:', teeResponse.error);
        return;
      }
      
      const teeSetData = teeResponse.data?.tees || [];
      console.log('Fetched tee sets via API:', teeSetData);
      
      // Fetch holes
      const holesResponse = await CoursesApiClient.getCourseHoles(currentCourseId);
      if (!holesResponse.success) {
        console.error('Error fetching holes:', holesResponse.error);
        return;
      }
      
      const holeData = holesResponse.data?.holes || [];
      console.log('Fetched holes via API:', holeData);
      
      // Process tee sets to match our component's expected format
      const processedTeeSets: TeeSet[] = teeSetData.map(teeSet => ({
        id: teeSet.id,
        name: teeSet.teeName,
        color: teeSet.gender === 'Male' ? 'Blue' : 
               teeSet.gender === 'Female' ? 'Red' : 'White',
        rating: teeSet.courseRating,
        slope: teeSet.slopeRating,
        length: teeSet.yardage
      }));
      
      // Process holes to match our component's expected format
      const processedHoles: Hole[] = holeData.map(hole => ({
        id: hole.id,
        number: hole.holeNumber,
        par: hole.par,
        handicap_index: hole.handicapIndex,
        notes: hole.notes || ''
      }));
      
      console.log('Processed tee sets:', processedTeeSets);
      console.log('Processed holes:', processedHoles);
      
      // Update state with the fetched data
      setTeeBoxes(processedTeeSets);
      setHoles(processedHoles);
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
    
    // If we've already saved the tee boxes as part of the initial course save, and they haven't changed,
    // we can skip saving again but still mark as success
    if (teesHaveBeenSaved && extractedCourseData?.teeSets) {
      console.log('Tee boxes already saved during extraction, no need to save again');
      return true;
    }
    
    try {
      setLoading(true);
      
      console.log('Saving tee boxes for course ID:', currentCourseId);
      console.log('Tee boxes to save:', teeBoxes);
      
      if (teeBoxes.length === 0) {
        console.log('No tee boxes to save');
        return true;
      }
      
      // Convert tee boxes to API format and send in bulk
      const teePayloads = teeBoxes.map(teeBox => ({
        teeName: teeBox.name,
        gender: 'Unisex' as 'Male' | 'Female' | 'Unisex', // Default to Unisex with proper type
        par: formData.par, // Use the course par as the TeeSet type doesn't have par
        courseRating: teeBox.rating, // Use rating from TeeSet
        slopeRating: teeBox.slope, // Use slope from TeeSet
        yardage: teeBox.length // Use length from TeeSet as yardage
      }));
      
      // Use the bulk update API
      const response = await CoursesApiClient.bulkUpdateCourseTees(currentCourseId, teePayloads);
      
      if (!response.success) {
        console.error('Error saving tee boxes:', response.error);
        throw new Error(`Failed to save tee boxes: ${response.error?.message}`);
      }
      
      console.log('Tee boxes saved successfully');
      setTeesHaveBeenSaved(true);
      
      // After successful save, fetch the tee boxes again to ensure we have the latest data
      // This ensures we have the server-generated IDs which might be needed later
      await fetchTeeBoxesAndHoles(currentCourseId);
      
      return true;
    } catch (error) {
      console.error('Error in saveTeeBoxes:', error);
      setError(`Failed to save tee boxes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Even if there's an error, don't lose the tee boxes data
      // The user can try saving again
      
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
    
    if (!holes || holes.length === 0) {
      console.error('No holes data available to save');
      setError('No holes data available to save. Please add holes first.');
      return false;
    }
    
    try {
      setLoading(true);
      
      // Convert holes to API format and send in bulk
      const holePayloads = holes.map(hole => ({
        holeNumber: hole.number,
        par: hole.par,
        handicapIndex: hole.handicap_index || 0,
        notes: hole.notes || undefined
      }));
      
      // Use the bulk update API
      const response = await CoursesApiClient.bulkUpdateCourseHoles(currentCourseId, holePayloads);
      
      if (!response.success) {
        console.error('Error saving scorecard:', response.error);
        throw new Error(`Failed to save scorecard: ${response.error?.message}`);
      }
      
      console.log('Scorecard saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving scorecard:', error);
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
      
      console.log('Submitting course data:', formData);
      console.log('Is course active?', formData.isActive);

      let savedCourseId: string | undefined = undefined;
      
      console.log('Starting handleSubmit with courseId:', courseId);
      console.log('Current courseIdRef:', courseIdRef.current);
      console.log('Form data:', formData);
      
      // If we already have a courseId in the ref, use that instead of creating a new one
      if (activeStep > 0 && courseIdRef.current) {
        console.log('Using existing courseId from ref:', courseIdRef.current);
        savedCourseId = courseIdRef.current;
        
        // Update the existing course using API client
        try {
          console.log(`Updating course with ID: ${savedCourseId}`);
          
          // Prepare course data for API
          const courseData: UpdateCoursePayload = {
            name: formData.name,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            phone_number: formData.phoneNumber,
            website: formData.website,
            amenities: formData.amenities
          };
          
          const updateResponse = await CoursesApiClient.updateCourse(savedCourseId, courseData);
            
          if (!updateResponse.success) {
            console.error('Error updating course:', updateResponse.error);
            // Continue with the flow even if update fails
          } else {
            console.log('Course updated successfully');
          }
        } catch (updateError) {
          console.error('Error updating course:', updateError);
          // Continue with the flow even if update fails
        }
      } else {
        // Prepare course data for API
        const courseData: CreateCoursePayload = {
          name: formData.name,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          phone_number: formData.phoneNumber,
          website: formData.website,
          amenities: formData.amenities
        };
        
        console.log('Prepared course data for save:', courseData);

        try {
          if (isEditMode && courseId) {
            // Update existing course using API client
            console.log(`Updating course with ID: ${courseId}`);
            
            const updateResponse = await CoursesApiClient.updateCourse(courseId, courseData);
            
            if (!updateResponse.success) {
              console.error('Error updating course:', updateResponse.error);
              throw new Error(`Failed to update course: ${updateResponse.error?.message}`);
            } else {
              console.log('Course updated successfully');
              savedCourseId = courseId;
            }
          } else {
            // Create new course using API client
            console.log('Creating new course');
            
            const createResponse = await CoursesApiClient.createCourse(courseData);
            
            if (!createResponse.success) {
              console.error('Error creating course:', createResponse.error);
              throw new Error(`Failed to create course: ${createResponse.error?.message}`);
            } else {
              console.log('Course created successfully');
              savedCourseId = createResponse.data?.id;
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
      
      // If we have a course ID and extracted data for tee boxes and holes, save them immediately
      if (savedCourseId && extractedCourseData) {
        console.log('We have extracted data and a course ID, attempting to save all data at once.');
        
        try {
          // First save tee boxes if we have them
          if (extractedCourseData.teeSets && extractedCourseData.teeSets.length > 0) {
            console.log('Saving extracted tee boxes:', extractedCourseData.teeSets);
            
            // Format tee boxes for API
            const teePayloads = extractedCourseData.teeSets.map(teeSet => ({
              teeName: teeSet.name,
              gender: 'Unisex' as 'Male' | 'Female' | 'Unisex', // Default to Unisex
              par: formData.par, // Use course par
              courseRating: teeSet.rating,
              slopeRating: teeSet.slope,
              yardage: teeSet.length
            }));
            
            // Save tee boxes
            const teeResponse = await CoursesApiClient.bulkUpdateCourseTees(savedCourseId, teePayloads);
            if (teeResponse.success) {
              console.log('Successfully saved tee boxes along with course');
              setTeesHaveBeenSaved(true);
            } else {
              console.error('Failed to save tee boxes:', teeResponse.error);
            }
          }
          
          // Then save holes if we have them
          if (extractedCourseData.holes && extractedCourseData.holes.length > 0) {
            console.log('Saving extracted holes:', extractedCourseData.holes);
            
            // Format holes for API
            const holePayloads = extractedCourseData.holes.map(hole => ({
              holeNumber: hole.number,
              par: hole.par,
              handicapIndex: hole.handicapIndex,
              notes: hole.notes
            }));
            
            // Save holes
            const holesResponse = await CoursesApiClient.bulkUpdateCourseHoles(savedCourseId, holePayloads);
            if (holesResponse.success) {
              console.log('Successfully saved holes along with course');
            } else {
              console.error('Failed to save holes:', holesResponse.error);
            }
          }
        } catch (saveAllError) {
          console.error('Error saving extracted data:', saveAllError);
          // Don't block the workflow if this fails, just log the error
        }
      }
      
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
  
  // Validate form data before submission
  const validateForm = () => {
    // Basic validation
    if (!formData.name.trim()) {
      setError('Course name is required');
      return false;
    }
    
    // Website URL validation (if provided)
    if (formData.website && formData.website.trim() !== '') {
      // Check if it has a protocol, if not add https:// for API submission
      if (!formData.website.startsWith('http://') && !formData.website.startsWith('https://')) {
        formData.website = `https://${formData.website}`;
      }
      
      try {
        // Still verify it's a valid URL when a protocol is added
        new URL(formData.website);
      } catch (err) {
        setError('Please enter a valid website URL (e.g., example.com)');
        return false;
      }
    }
    
    return true;
  };
  
  // Handle step navigation
  const handleNext = () => {
    const currentStep = activeStep;
    const nextStep = currentStep + 1;
    
    if (currentStep === 0) {
      // When moving from Course Info to Tee Boxes, make sure to submit the form
      // and save course info first if not already done
      if (!courseId) {
        const form = document.querySelector('form');
        if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
        return;
      }
    } else if (currentStep === 1) {
      // When moving from Tee Boxes to Scorecard, save tee boxes first
      saveTeeBoxes().then(success => {
        if (success) {
          console.log('Tee boxes saved successfully, moving to next step');
          // Make sure to keep the tee boxes data in state before moving to the next step
          setActiveStep(nextStep);
        }
      });
      return;
    }
    
    setActiveStep(nextStep);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };
  
  // Get content for the current step
  const getStepContent = (step: number) => {
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
            onFullDataExtracted={handleFullDataExtracted}
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
            extractedData={extractedCourseData}
          />
        );
      case 2:
        // If we don't have any holes, generate default ones
        if (!holes || holes.length === 0) {
          console.log('No holes found, generating default holes');
          
          // Generate default holes (18 holes) - without any length/yardage properties
          const defaultHoles: Hole[] = Array.from({ length: 18 }, (_, i) => ({
            number: i + 1,
            par: 4,
            handicap_index: i + 1
          }));
          
          // Update the holes state
          setHoles(defaultHoles);
        }
        
        return (
          <ScorecardStep
            courseId={courseId || ''}
            teeBoxes={teeBoxes}
            holes={holes}
            setHoles={setHoles}
            handleSubmit={handleSubmit}
            handleBack={handleBack}
            saveScorecard={saveScorecard}
            loading={loading}
            processingImage={processingImage}
            setProcessingImage={setProcessingImage}
            extractionStep={extractionStep}
            setExtractionStep={setExtractionStep}
            isMobile={isMobile}
            extractedData={extractedCourseData}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  // Handle touch start event
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0].clientX);
  };
  
  // Handle touch end event
  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;
    
    // If swipe distance is significant (over 50px)
    if (Math.abs(diff) > 50) {
      if (diff > 0 && activeStep > 0) {
        // Swipe right - go back
        handleBack();
      } else if (diff < 0 && activeStep < steps.length - 1 && !loading) {
        // Swipe left - go next
        handleNext();
      }
    }
    
    setTouchStartX(null);
  };

  // Handle full data extraction from AI
  const handleFullDataExtracted = (data: ExtractedCourseData) => {
    console.log('Full data extracted:', data);
    setExtractedCourseData(data);
    
    // Track what data we found
    let foundTeeSets = false;
    let foundHoles = false;
    
    // If we have tee sets, store them for the next step
    if (data.teeSets && data.teeSets.length > 0) {
      const formattedTeeSets = data.teeSets.map(teeSet => ({
        id: uuidv4(),
        name: teeSet.name,
        color: teeSet.color,
        rating: teeSet.rating,
        slope: teeSet.slope,
        length: teeSet.length
      }));
      setTeeBoxes(formattedTeeSets);
      foundTeeSets = true;
    }
    
    // If we have holes, store them for the scorecard step
    if (data.holes && data.holes.length > 0) {
      const formattedHoles = data.holes.map(hole => ({
        id: undefined,
        number: hole.number,
        par: hole.par,
        handicap_index: hole.handicapIndex,
        notes: hole.notes || ''
      }));
      setHoles(formattedHoles);
      foundHoles = true;
    }
    
    // Show feedback to the user about what we extracted
    let message = 'Course information extracted.';
    if (foundTeeSets && foundHoles) {
      message += ' Tee boxes and hole information were also detected and will be pre-populated in the next steps.';
    } else if (foundTeeSets) {
      message += ' Tee boxes were also detected and will be pre-populated in the next step.';
    } else if (foundHoles) {
      message += ' Hole information was also detected and will be pre-populated in the scorecard step.';
    }
    
    setSuccess(true);
    // Show more specific success message about what was extracted
    setSuccessMessage(message);
  };

  // Render mobile or desktop stepper based on screen size
  const renderStepper = () => {
    // Always render the mobile stepper to ensure navigation arrows are available
    return (
      <Box 
        sx={{ width: '100%', mb: 3 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
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
              Previous
            </Button>
          }
        />
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
        onClose={() => {
          setSuccess(false);
          setSuccessMessage(null);
        }}
        message={successMessage || 'Course saved successfully'}
      />
      
      {renderStepper()}
    </Box>
  );
};

export default CourseFormContainer; 