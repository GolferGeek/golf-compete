'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { User } from '@supabase/supabase-js';
import { type AuthProfile } from '@/api/internal/auth/AuthService';
import { CoursesApiClient } from '@/lib/apiClient/courses';

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
  notes?: string;
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
  profile: AuthProfile | null;
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
    setIsSubmitting(true);
    setSubmitError(null);
    let courseId: string | null = null;
    
    try {
      if (!user) {
        console.error('No active user found');
        setSubmitError('Authentication error. Please sign in again and retry.');
        setIsSubmitting(false);
        return;
      }
      
      console.log('Active user confirmed, user ID:', user.id);
      
      // Calculate course par
      const coursePar = holes.reduce((total, hole) => total + hole.par, 0);
      console.log('Calculated course par:', coursePar);
      
      // Create course using API client
      console.log('Creating course via API...');
      
      const courseResponse = await CoursesApiClient.createCourse({
        name: course.name,
        address: course.location, // Mapping location to address
        phone_number: course.phoneNumber,
        website: course.website,
        amenities: Array.isArray(course.amenities) ? course.amenities.join(',') : course.amenities,
        // Adding these fields as they're expected by the API
        city: '',
        state: '',
        country: 'USA'
      });
      
      if (!courseResponse.success || !courseResponse.data) {
        console.error('Course creation error:', courseResponse.error);
        setSubmitError(`Failed to create course: ${courseResponse.error?.message || 'Unknown error'}`);
        setIsSubmitting(false);
        return;
      }
      
      console.log('Course created successfully:', courseResponse.data);
      
      // Store the course ID for later use
      courseId = courseResponse.data.id;
      
      // Convert tee sets to API format
      const teePayloads = teeSets.map(teeSet => ({
        teeName: teeSet.name,
        gender: 'Unisex' as 'Male' | 'Female' | 'Unisex', // Default to Unisex
        par: coursePar,
        courseRating: teeSet.rating,
        slopeRating: teeSet.slope,
        yardage: 0 // Default value
      }));
      
      // Create tee sets using bulk API
      console.log('Creating tee sets via API...');
      const teeSetsResponse = await CoursesApiClient.bulkUpdateCourseTees(courseId, teePayloads);
      
      if (!teeSetsResponse.success) {
        console.error('Error creating tee sets:', teeSetsResponse.error);
        throw new Error(`Failed to create tee sets: ${teeSetsResponse.error?.message || 'Unknown error'}`);
      }
      
      console.log('Tee sets created successfully:', teeSetsResponse.data?.tees);
      
      // Convert holes to API format and create them
      const holePayloads = holes.map(hole => ({
        holeNumber: hole.number,
        par: hole.par,
        handicapIndex: hole.handicapIndex,
        notes: hole.notes || ''
      }));
      
      console.log('Creating holes via API...');
      const holesResponse = await CoursesApiClient.bulkUpdateCourseHoles(courseId, holePayloads);
      
      if (!holesResponse.success) {
        console.error('Error creating holes:', holesResponse.error);
        throw new Error(`Failed to create holes: ${holesResponse.error?.message || 'Unknown error'}`);
      }
      
      console.log('Holes created successfully:', holesResponse.data?.holes);
      
      // Handle image uploads if present
      if (teeSetImage) {
        console.log('Uploading tee set image...');
        const formData = new FormData();
        formData.append('file', teeSetImage);
        formData.append('courseId', courseId);
        formData.append('type', 'tee_set');
        
        const teeImageResponse = await fetch('/api/courses/upload-image', {
          method: 'POST',
          body: formData
        });
        
        if (!teeImageResponse.ok) {
          console.error('Failed to upload tee set image');
        }
      }
      
      if (scorecardImage) {
        console.log('Uploading scorecard image...');
        const formData = new FormData();
        formData.append('file', scorecardImage);
        formData.append('courseId', courseId);
        formData.append('type', 'scorecard');
        
        const scorecardImageResponse = await fetch('/api/courses/upload-image', {
          method: 'POST',
          body: formData
        });
        
        if (!scorecardImageResponse.ok) {
          console.error('Failed to upload scorecard image');
        }
      }
      
      // Success! Reset form and move to success state
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
      
    } catch (error) {
      console.error('Error in course creation:', error);
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
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
    profile
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
