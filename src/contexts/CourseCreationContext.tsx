'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getBrowserClient } from '@/lib/supabase-browser';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from './AuthContext';
import { User } from '@supabase/supabase-js';
import { Profile } from './AuthContext';

// Define types
export interface Course {
  name: string;
  location: string;
  phoneNumber?: string;
  email?: string;
  website?: string;
  amenities?: string[];
}

export interface TeeSet {
  name: string;
  color: string;
  rating: number;
  slope: number;
}

export interface HoleDetails {
  number: number;
  par: number;
  handicapIndex: number;
  distances: Record<string, number>; // Key is tee color, value is distance
}

interface CourseCreationContextType {
  // Step management
  currentStep: number;
  nextStep: () => void;
  prevStep: () => void;
  
  // Course data
  course: Course;
  setCourse: React.Dispatch<React.SetStateAction<Course>>;
  
  // Tee sets
  teeSets: TeeSet[];
  setTeeSets: React.Dispatch<React.SetStateAction<TeeSet[]>>;
  
  // Hole details
  holes: HoleDetails[];
  setHoles: React.Dispatch<React.SetStateAction<HoleDetails[]>>;
  
  // Images
  teeSetImage: File | null;
  setTeeSetImage: (file: File) => void;
  scorecardImage: File | null;
  setScorecardImage: (file: File) => void;
  
  // Submit course
  submitCourse: () => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  
  // Auth context
  user: User | null;
  profile: Profile | null;
}

const CourseCreationContext = createContext<CourseCreationContextType | undefined>(undefined);

export function CourseCreationProvider({ children }: { children: ReactNode }) {
  // Get auth context
  const { user, profile } = useAuth();
  
  // Step management
  const [currentStep, setCurrentStep] = useState(0);
  
  // Course data
  const [course, setCourse] = useState<Course>({
    name: '',
    location: '',
    phoneNumber: '',
    email: '',
    website: '',
    amenities: []
  });
  
  // Tee sets
  const [teeSets, setTeeSets] = useState<TeeSet[]>([]);
  
  // Hole details
  const [holes, setHoles] = useState<HoleDetails[]>([]);
  
  // Images
  const [teeSetImage, setTeeSetImageState] = useState<File | null>(null);
  const [scorecardImage, setScorecardImageState] = useState<File | null>(null);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Step navigation
  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };
  
  // Set image files
  const setTeeSetImage = (file: File) => {
    setTeeSetImageState(file);
  };
  
  const setScorecardImage = (file: File) => {
    setScorecardImageState(file);
  };
  
  // Submit course to database
  const submitCourse = async () => {
    if (!course.name || !course.location || teeSets.length === 0 || holes.length === 0) {
      setSubmitError('Missing required course information');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      console.log('Starting course submission process...');
      
      // Get the browser client for consistent auth handling
      const supabase = getBrowserClient();
      
      // Check for active session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session found');
        setSubmitError('Authentication error. Please sign in again and retry.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Active session confirmed, user ID:', session.user.id);
      
      // We no longer need to upload and store the scorecard image
      // Just calculate course par and continue with course creation
      
      // Calculate course par
      const coursePar = holes.reduce((total, hole) => total + hole.par, 0);
      console.log('Calculated course par:', coursePar);
      
      // Insert course
      console.log('Inserting course record...');
      const { data: insertedCourse, error: courseError } = await supabase
        .from('courses')
        .insert({
          name: course.name,
          location: course.location,
          phone_number: course.phoneNumber,
          website: course.website,
          // Convert amenities to a string if it's an array
          amenities: Array.isArray(course.amenities) ? course.amenities.join(',') : course.amenities,
          holes: holes.length,
          par: coursePar
        })
        .select()
        .single();
      
      if (courseError) {
        console.error('Course insertion error:', courseError);
        setSubmitError(`Failed to insert course: ${courseError.message}`);
        return;
      }
      
      console.log('Course inserted successfully:', insertedCourse);
      
      // Store the course ID for later use
      const courseId = insertedCourse.id;
      
      // Insert tee sets
      console.log('Inserting tee sets...');
      try {
        const teeSetPromises = teeSets.map(async (teeSet, index) => {
          console.log(`Inserting tee set ${index + 1}:`, teeSet);
          try {
            const { data: insertedTeeSet, error: teeSetError } = await supabase
              .from('tee_sets')
              .insert({
                course_id: courseId,
                name: teeSet.name,
                color: teeSet.color,
                rating: teeSet.rating,
                slope: teeSet.slope,
                par: coursePar, // Use the course par for the tee set par
                distance: 0 // Add default distance to satisfy not-null constraint if it exists
              })
              .select()
              .single();
            
            if (teeSetError) {
              console.error(`Error inserting tee set ${index + 1}:`, teeSetError);
              throw teeSetError;
            }
            
            console.log(`Tee set ${index + 1} inserted successfully:`, insertedTeeSet);
            return insertedTeeSet;
          } catch (teeSetErr) {
            console.error(`Error processing tee set ${index + 1}:`, teeSetErr);
            throw teeSetErr;
          }
        });
        
        // Wait for all tee sets to be inserted
        const insertedTeeSets = await Promise.all(teeSetPromises);
        console.log('All tee sets inserted successfully:', insertedTeeSets);
        
        // Insert holes
        console.log('Inserting holes...');
        const holePromises = holes.map(async (hole, index) => {
          console.log(`Inserting hole ${hole.number}:`, hole);
          try {
            // Create a base hole record
            const { data: insertedHole, error: holeError } = await supabase
              .from('holes')
              .insert({
                course_id: courseId,
                hole_number: hole.number,
                par: hole.par,
                handicap_index: hole.handicapIndex
              })
              .select()
              .single();
            
            if (holeError) {
              console.error(`Error inserting hole ${hole.number}:`, holeError);
              throw holeError;
            }
            
            console.log(`Hole ${hole.number} inserted successfully:`, insertedHole);
            
            // Insert distances for each tee set
            const distancePromises = Object.entries(hole.distances).map(async ([teeColor, distance]) => {
              // Find the tee set ID by color
              const teeSet = insertedTeeSets.find(ts => ts.color.toLowerCase() === teeColor.toLowerCase());
              
              if (!teeSet) {
                console.warn(`Could not find tee set with color ${teeColor} for distance insertion`);
                return null;
              }
              
              console.log(`Inserting distance for hole ${hole.number}, tee ${teeColor}: ${distance}`);
              
              const { data: insertedDistance, error: distanceError } = await supabase
                .from('tee_set_distances')
                .insert({
                  hole_id: insertedHole.id,
                  tee_set_id: teeSet.id,
                  distance: distance
                })
                .select()
                .single();
              
              if (distanceError) {
                console.error(`Error inserting distance for hole ${hole.number}, tee ${teeColor}:`, distanceError);
                throw distanceError;
              }
              
              return insertedDistance;
            });
            
            const insertedDistances = await Promise.all(distancePromises);
            console.log(`All distances for hole ${hole.number} inserted successfully:`, insertedDistances);
            
            return {
              hole: insertedHole,
              distances: insertedDistances.filter(Boolean)
            };
          } catch (holeErr) {
            console.error(`Error processing hole ${hole.number}:`, holeErr);
            throw holeErr;
          }
        });
        
        // Wait for all holes to be inserted
        const insertedHoles = await Promise.all(holePromises);
        console.log('All holes inserted successfully:', insertedHoles);
        
        // Everything was successful
        console.log('Course creation completed successfully!');
        setCurrentStep(0);
        setCourse({
          name: '',
          location: '',
          phoneNumber: '',
          email: '',
          website: '',
          amenities: []
        });
        setTeeSets([]);
        setHoles([]);
        setTeeSetImageState(null);
        setScorecardImageState(null);
        
        // Show success message
        alert('Course created successfully!');
        
      } catch (detailsError) {
        console.error('Error inserting course details:', detailsError);
        setSubmitError(`Failed to insert course details: ${detailsError instanceof Error ? detailsError.message : String(detailsError)}`);
        
        // Try to clean up the partial course
        try {
          console.log('Attempting to clean up partial course data...');
          await supabase.from('courses').delete().eq('id', courseId);
          console.log('Partial course data cleaned up');
        } catch (cleanupError) {
          console.error('Error cleaning up partial course data:', cleanupError);
        }
      }
    } catch (error) {
      console.error('Error in course submission:', error);
      setSubmitError(`Failed to submit course: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const value = {
    currentStep,
    nextStep,
    prevStep,
    course,
    setCourse,
    teeSets,
    setTeeSets,
    holes,
    setHoles,
    teeSetImage,
    setTeeSetImage,
    scorecardImage,
    setScorecardImage,
    submitCourse,
    isSubmitting,
    submitError,
    user,
    profile,
  };
  
  return (
    <CourseCreationContext.Provider value={value}>
      {children}
    </CourseCreationContext.Provider>
  );
}

export function useCourseCreationContext() {
  const context = useContext(CourseCreationContext);
  if (context === undefined) {
    throw new Error('useCourseCreationContext must be used within a CourseCreationProvider');
  }
  return context;
}
