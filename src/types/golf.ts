// Golf-related type definitions

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  handicap?: number;
  profileImage?: string;
  memberSince: Date;
  isAdmin?: boolean; // Flag to identify administrators
}

// Competition types
export type CompetitionType = 'series' | 'event' | 'daily';

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  startDate: Date;
  endDate: Date;
  description: string;
  participants: User[];
  status: 'upcoming' | 'active' | 'completed';
  format: string;
  prizes?: string[];
}

// Course types
export interface Course {
  id: string;
  name: string;
  city: string;
  state: string;
  par: number;
  holes: number;
  rating?: number;
  slope?: number;
  tees: TeeSets[];
  holeDetails?: Hole[];
  amenities?: string[];
  website?: string;
  phone_number?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TeeSets {
  name: string;
  color: string;
  rating: number;
  slope: number;
  par: number;
  distance: number;
  holeDistances?: Record<number, number>;
}

export interface Hole {
  id: string;
  courseId: string;
  holeNumber: number;
  par: number;
  handicapIndex?: number;
  length?: number;
  description?: string;
  distances: TeeSetDistance[];
}

export interface TeeSetDistance {
  teeSetId: string;
  holeId: string;
  distance: number;
}

// Round and scoring types
export interface Round {
  id: string;
  date: Date;
  course: Course;
  teeSet: string;
  scores: HoleScore[];
  totalScore: number;
  userId: string;
  competitionId?: string;
  notes?: string;
}

export interface HoleScore {
  holeNumber: number;
  par: number;
  score: number;
  fairwayHit?: boolean;
  greenInRegulation?: boolean;
  putts?: number;
  penaltyStrokes?: number;
}

// Improvement and practice types
export interface PracticePlan {
  id: string;
  name: string;
  userId: string;
  focusAreas: string[];
  drills: Drill[];
  duration: number; // in minutes
  frequency: string;
  notes?: string;
}

export interface Drill {
  id: string;
  name: string;
  description: string;
  category: 'putting' | 'chipping' | 'pitching' | 'full swing' | 'bunker' | 'mental';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  equipment?: string[];
  instructions: string;
}

// Coaching types
export interface Coach {
  id: string;
  userId: string;
  credentials: string[];
  specialties: string[];
  experience: number; // in years
  hourlyRate: number;
  availability: string[];
}

export interface Lesson {
  id: string;
  coachId: string;
  studentId: string;
  date: Date;
  duration: number; // in minutes
  focus: string;
  notes?: string;
  followUpActions?: string[];
} 