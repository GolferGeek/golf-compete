import * as db from '../database/databaseService';

// Types
export interface Course {
  id: string;
  name: string;
  location: string;
  holes: number;
  par: number;
  amenities?: string;
  website?: string;
  phone_number?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TeeSet {
  id: string;
  course_id: string;
  name: string;
  color: string;
  slope?: number;
  rating?: number;
  par?: number;
  yardage?: number;
}

export interface Hole {
  id: string;
  course_id: string;
  hole_number: number;
  par: number;
  handicap_index?: number;
  yardages?: Record<string, number>;
}

// Course functions
export const fetchAllCourses = async (limit?: number, offset?: number): Promise<Course[]> => {
  return db.fetchCourses(limit, offset) as Promise<Course[]>;
};

export const fetchCourseById = async (courseId: string): Promise<Course> => {
  return db.fetchCourseById(courseId) as Promise<Course>;
};

export const createCourse = async (courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course[]> => {
  return db.createCourse(courseData) as Promise<Course[]>;
};

export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<Course[]> => {
  return db.updateCourse(courseId, courseData) as Promise<Course[]>;
};

export const deleteCourse = async (courseId: string): Promise<boolean> => {
  return db.deleteCourse(courseId);
};

// Tee box functions
export const fetchTeeBoxes = async (courseId: string): Promise<TeeSet[]> => {
  return db.fetchTeeBoxes(courseId) as Promise<TeeSet[]>;
};

export const saveTeeBoxes = async (courseId: string, teeBoxes: Omit<TeeSet, 'id' | 'course_id'>[]): Promise<TeeSet[]> => {
  // First delete existing tee boxes
  await db.deleteTeeBoxes(courseId);
  
  // Then create new ones if there are any
  if (teeBoxes.length === 0) {
    return [];
  }
  
  // Add course_id to each tee box
  const teeBoxesWithCourseId = teeBoxes.map(teeBox => ({
    ...teeBox,
    course_id: courseId
  }));
  
  return db.createTeeBoxes(teeBoxesWithCourseId) as Promise<TeeSet[]>;
};

// Hole functions
export const fetchHoles = async (courseId: string): Promise<Hole[]> => {
  return db.fetchHoles(courseId) as Promise<Hole[]>;
};

export const saveHoles = async (courseId: string, holes: Omit<Hole, 'id' | 'course_id'>[]): Promise<Hole[]> => {
  // First delete existing holes
  await db.deleteHoles(courseId);
  
  // Then create new ones if there are any
  if (holes.length === 0) {
    return [];
  }
  
  // Add course_id to each hole
  const holesWithCourseId = holes.map(hole => ({
    ...hole,
    course_id: courseId
  }));
  
  return db.createHoles(holesWithCourseId) as Promise<Hole[]>;
};

// Complete course operations
export const fetchCompleteCourse = async (courseId: string): Promise<{
  course: Course;
  teeBoxes: TeeSet[];
  holes: Hole[];
}> => {
  const course = await fetchCourseById(courseId);
  const teeBoxes = await fetchTeeBoxes(courseId);
  const holes = await fetchHoles(courseId);
  
  return {
    course,
    teeBoxes,
    holes
  };
};

export const saveCompleteCourse = async (
  courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>,
  teeBoxes: Omit<TeeSet, 'id' | 'course_id'>[],
  holes: Omit<Hole, 'id' | 'course_id'>[]
): Promise<{
  course: Course;
  teeBoxes: TeeSet[];
  holes: Hole[];
}> => {
  // Create the course first
  const createdCourse = await createCourse(courseData);
  const courseId = createdCourse[0].id;
  
  // Then save tee boxes and holes
  const savedTeeBoxes = await saveTeeBoxes(courseId, teeBoxes);
  const savedHoles = await saveHoles(courseId, holes);
  
  return {
    course: createdCourse[0],
    teeBoxes: savedTeeBoxes,
    holes: savedHoles
  };
};

export const updateCompleteCourse = async (
  courseId: string,
  courseData: Partial<Course>,
  teeBoxes: Omit<TeeSet, 'id' | 'course_id'>[],
  holes: Omit<Hole, 'id' | 'course_id'>[]
): Promise<{
  course: Course;
  teeBoxes: TeeSet[];
  holes: Hole[];
}> => {
  // Update the course first
  const updatedCourse = await updateCourse(courseId, courseData);
  
  // Then save tee boxes and holes
  const savedTeeBoxes = await saveTeeBoxes(courseId, teeBoxes);
  const savedHoles = await saveHoles(courseId, holes);
  
  return {
    course: updatedCourse[0],
    teeBoxes: savedTeeBoxes,
    holes: savedHoles
  };
}; 