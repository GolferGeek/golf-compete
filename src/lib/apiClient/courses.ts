// src/lib/apiClient/courses.ts
import { type Course, type CourseTee } from '@/types/database';
import { type PaginatedResponse } from '@/api/base';
import { handleApiResponse, buildQueryString } from './utils';

interface ListCoursesParams { /* Define params */ }

export async function fetchCoursesList(params: ListCoursesParams = {}): Promise<PaginatedResponse<Course>> {
    const queryString = buildQueryString(params);
    const response = await fetch(`/api/courses${queryString ? `?${queryString}` : ''}`);
    return handleApiResponse<PaginatedResponse<Course>>(response);
}

export async function getCourseById(courseId: string, includeTees: boolean = false): Promise<Course & { tees?: CourseTee[] }> {
    const queryString = includeTees ? buildQueryString({ include_tees: true }) : '';
    const response = await fetch(`/api/courses/${courseId}${queryString ? `?${queryString}` : ''}`);
    return handleApiResponse<Course & { tees?: CourseTee[] }>(response);
}

// Add createCourse, updateCourse, deleteCourse, tee methods... 

// Define ApiResponse interface here if not imported from a shared module
export interface ApiResponse {
  success: boolean;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Data transfer object for Course entities
 */
export interface CourseDto {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone_number?: string;
  website?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  par?: number;
  holes?: number;
  amenities?: string;
  // Optional related data
  tees?: CourseTeeDto[];
}

/**
 * Data transfer object for CourseTee entities
 */
export interface CourseTeeDto {
  id: string;
  courseId: string;
  teeName: string;
  gender: 'Male' | 'Female' | 'Unisex';
  par: number;
  courseRating: number;
  slopeRating: number;
  yardage?: number;
}

/**
 * Parameters for querying courses
 */
export interface CoursesQueryParams {
  limit?: number;
  offset?: number;
  page?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  search?: string;
  city?: string;
  state?: string;
  country?: string;
  includeTees?: boolean;
}

/**
 * Payload for creating a new course
 */
export interface CreateCoursePayload {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone_number?: string;
  website?: string;
  amenities?: string;
}

/**
 * Payload for updating an existing course
 */
export interface UpdateCoursePayload {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone_number?: string;
  website?: string;
  amenities?: string;
  createdBy?: string;
}

/**
 * Payload for creating a new tee
 */
export interface CreateCourseTeePayload {
  teeName: string;
  gender: 'Male' | 'Female' | 'Unisex';
  par: number;
  courseRating: number;
  slopeRating: number;
  yardage?: number;
}

/**
 * Response containing an array of courses
 */
export interface CoursesApiResponse extends ApiResponse {
  success: boolean;
  data?: {
    courses: CourseDto[];
    total: number;
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Response containing a single course
 */
export interface CourseApiResponse extends ApiResponse {
  success: boolean;
  data?: CourseDto;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Response containing an array of course tees
 */
export interface CourseTeesApiResponse extends ApiResponse {
  success: boolean;
  data?: {
    tees: CourseTeeDto[];
    total: number;
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Response containing a single course tee
 */
export interface CourseTeeApiResponse extends ApiResponse {
  success: boolean;
  data?: CourseTeeDto;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Data transfer object for Hole entities
 */
export interface HoleDto {
  id: string;
  courseId: string;
  holeNumber: number;
  par: number;
  handicapIndex: number;
  yards?: number;
  notes?: string;
}

/**
 * Response containing an array of course holes
 */
export interface CourseHolesApiResponse extends ApiResponse {
  success: boolean;
  data?: {
    holes: HoleDto[];
    total: number;
  };
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Response containing a single hole
 */
export interface HoleApiResponse extends ApiResponse {
  success: boolean;
  data?: HoleDto;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
}

/**
 * Payload for creating a new hole
 */
export interface CreateHolePayload {
  holeNumber: number;
  par: number;
  handicapIndex: number;
  yards?: number;
  notes?: string;
}

/**
 * Helper function to map database Course to CourseDto
 */
function mapCourseToDto(course: Course, tees?: CourseTee[]): CourseDto {
  return {
    id: course.id,
    name: course.name,
    address: course.address,
    city: course.city,
    state: course.state,
    country: course.country,
    phone_number: course.phone_number,
    website: course.website,
    createdBy: course.created_by,
    createdAt: course.created_at,
    updatedAt: course.updated_at,
    isActive: course.is_active,
    par: course.par,
    holes: course.holes,
    amenities: course.amenities,
    tees: tees ? tees.map(tee => mapCourseTeeToDto(tee)) : undefined
  };
}

/**
 * Helper function to map database CourseTee to CourseTeeDto
 */
function mapCourseTeeToDto(tee: CourseTee): CourseTeeDto {
  return {
    id: tee.id,
    courseId: tee.course_id,
    teeName: tee.tee_name,
    gender: tee.gender,
    par: tee.par,
    courseRating: tee.rating,
    slopeRating: tee.slope_rating,
    yardage: tee.yardage
  };
}

/**
 * Helper function to map database Hole to HoleDto
 */
function mapHoleToDto(hole: any): HoleDto {
  return {
    id: hole.id,
    courseId: hole.course_id,
    holeNumber: hole.hole_number,
    par: hole.par,
    handicapIndex: hole.handicap_index,
    yards: hole.yards,
    notes: hole.notes
  };
}

/**
 * API client for courses operations
 */
export const CoursesApiClient = {
  /**
   * Fetch all courses with optional filters and pagination
   */
  async getCourses(params: CoursesQueryParams = {}): Promise<CoursesApiResponse> {
    try {
      // Convert params to query string
      const queryParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()));
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });
      
      const queryString = queryParams.toString();
      const endpoint = `/api/courses${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to fetch courses:', errorData);
        return {
          success: false,
          error: {
            message: errorData.message || 'Failed to fetch courses',
            code: 'FETCH_COURSES_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      console.log('Raw API response in courses.ts:', data);
      
      return {
        success: true,
        data: {
          courses: data.data || [],
          total: data.metadata?.total || 0
        }
      };
    } catch (error) {
      console.error('Error fetching courses:', error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching courses',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Fetch a single course by ID
   */
  async getCourseById(courseId: string, includeTees: boolean = false): Promise<CourseApiResponse> {
    try {
      // Add includeTees parameter if needed
      const queryParams = new URLSearchParams();
      if (includeTees) {
        queryParams.append('include_tees', 'true');
      }
      
      const queryString = queryParams.toString();
      const endpoint = `/api/courses/${courseId}${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to fetch course with ID ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to fetch course with ID ${courseId}`,
            code: 'FETCH_COURSE_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error(`Error fetching course with ID ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching the course',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Create a new course
   */
  async createCourse(payload: CreateCoursePayload): Promise<CourseApiResponse> {
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to create course:', errorData);
        return {
          success: false,
          error: {
            message: errorData.message || 'Failed to create course',
            code: 'CREATE_COURSE_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error creating course:', error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while creating the course',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Update an existing course
   */
  async updateCourse(courseId: string, payload: UpdateCoursePayload): Promise<CourseApiResponse> {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to update course with ID ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to update course with ID ${courseId}`,
            code: 'UPDATE_COURSE_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error(`Error updating course with ID ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while updating the course',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Delete a course by ID
   */
  async deleteCourse(courseId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to delete course with ID ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to delete course with ID ${courseId}`,
            code: 'DELETE_COURSE_ERROR',
            details: errorData
          }
        };
      }
      
      return {
        success: true
      };
    } catch (error) {
      console.error(`Error deleting course with ID ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while deleting the course',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Fetch all tees for a course
   */
  async getCourseTees(courseId: string): Promise<CourseTeesApiResponse> {
    try {
      const response = await fetch(`/api/courses/${courseId}/tees`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to fetch tees for course ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to fetch tees for course ${courseId}`,
            code: 'FETCH_TEES_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: {
          tees: data.data || [],
          total: data.metadata?.total || 0
        }
      };
    } catch (error) {
      console.error(`Error fetching tees for course ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching tees',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Create a new tee for a course
   */
  async createCourseTee(courseId: string, payload: CreateCourseTeePayload): Promise<CourseTeeApiResponse> {
    try {
      const response = await fetch(`/api/courses/${courseId}/tees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to create tee for course ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to create tee for course ${courseId}`,
            code: 'CREATE_TEE_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error(`Error creating tee for course ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while creating the tee',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Update an existing tee
   */
  async updateCourseTee(
    courseId: string, 
    teeId: string, 
    payload: Partial<CreateCourseTeePayload>
  ): Promise<CourseTeeApiResponse> {
    try {
      const response = await fetch(`/api/courses/${courseId}/tees/${teeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to update tee ${teeId} for course ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to update tee ${teeId}`,
            code: 'UPDATE_TEE_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error(`Error updating tee ${teeId} for course ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while updating the tee',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Delete a tee
   */
  async deleteCourseTee(courseId: string, teeId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`/api/courses/${courseId}/tees/${teeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to delete tee ${teeId} for course ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to delete tee ${teeId}`,
            code: 'DELETE_TEE_ERROR',
            details: errorData
          }
        };
      }
      
      return {
        success: true
      };
    } catch (error) {
      console.error(`Error deleting tee ${teeId} for course ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while deleting the tee',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Fetch all holes for a course
   */
  async getCourseHoles(courseId: string): Promise<CourseHolesApiResponse> {
    try {
      const response = await fetch(`/api/courses/${courseId}/holes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to fetch holes for course ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to fetch holes for course ${courseId}`,
            code: 'FETCH_HOLES_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      const mappedHoles = (data.data || []).map(mapHoleToDto);
      
      return {
        success: true,
        data: {
          holes: mappedHoles,
          total: mappedHoles.length
        }
      };
    } catch (error) {
      console.error(`Error fetching holes for course ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while fetching holes',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Create a new hole for a course
   */
  async createCourseHole(courseId: string, payload: CreateHolePayload): Promise<HoleApiResponse> {
    try {
      // Convert camelCase to snake_case for the API
      const apiPayload = {
        hole_number: payload.holeNumber,
        par: payload.par,
        handicap_index: payload.handicapIndex,
        yards: payload.yards,
        notes: payload.notes
      };
      
      const response = await fetch(`/api/courses/${courseId}/holes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(apiPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to create hole for course ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to create hole for course ${courseId}`,
            code: 'CREATE_HOLE_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: mapHoleToDto(data.data)
      };
    } catch (error) {
      console.error(`Error creating hole for course ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while creating the hole',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Update an existing hole
   */
  async updateCourseHole(
    courseId: string, 
    holeId: string, 
    payload: Partial<CreateHolePayload>
  ): Promise<HoleApiResponse> {
    try {
      // Convert camelCase to snake_case for the API
      const apiPayload: any = {};
      if (payload.holeNumber !== undefined) apiPayload.hole_number = payload.holeNumber;
      if (payload.par !== undefined) apiPayload.par = payload.par;
      if (payload.handicapIndex !== undefined) apiPayload.handicap_index = payload.handicapIndex;
      if (payload.yards !== undefined) apiPayload.yards = payload.yards;
      if (payload.notes !== undefined) apiPayload.notes = payload.notes;
      
      const response = await fetch(`/api/courses/${courseId}/holes/${holeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(apiPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to update hole ${holeId} for course ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to update hole ${holeId}`,
            code: 'UPDATE_HOLE_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: mapHoleToDto(data.data)
      };
    } catch (error) {
      console.error(`Error updating hole ${holeId} for course ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while updating the hole',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Delete a hole
   */
  async deleteCourseHole(courseId: string, holeId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(`/api/courses/${courseId}/holes/${holeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to delete hole ${holeId} for course ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to delete hole ${holeId}`,
            code: 'DELETE_HOLE_ERROR',
            details: errorData
          }
        };
      }
      
      return {
        success: true
      };
    } catch (error) {
      console.error(`Error deleting hole ${holeId} for course ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while deleting the hole',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Bulk update tees for a course
   */
  async bulkUpdateCourseTees(courseId: string, tees: CreateCourseTeePayload[]): Promise<CourseTeesApiResponse> {
    try {
      // Convert camelCase to snake_case for the API to match the database schema
      const apiPayload = tees.map(tee => ({
        tee_name: tee.teeName,
        gender: tee.gender,
        par: tee.par,
        // Fix column name to match database schema
        rating: tee.courseRating, // Changed from course_rating to match database
        slope_rating: tee.slopeRating,
        yardage: tee.yardage
      }));
      
      console.log('Sending tee payload:', apiPayload);
      
      const response = await fetch(`/api/courses/${courseId}/tees/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(apiPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to bulk update tees for course ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to bulk update tees for course ${courseId}`,
            code: 'BULK_UPDATE_TEES_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      return {
        success: true,
        data: {
          tees: data.data || [],
          total: data.data?.length || 0
        }
      };
    } catch (error) {
      console.error(`Error bulk updating tees for course ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while bulk updating tees',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  },

  /**
   * Bulk update holes for a course
   */
  async bulkUpdateCourseHoles(courseId: string, holes: CreateHolePayload[]): Promise<CourseHolesApiResponse> {
    try {
      // Convert camelCase to snake_case for the API
      const apiPayload = holes.map(hole => ({
        hole_number: hole.holeNumber,
        par: hole.par,
        handicap_index: hole.handicapIndex,
        yards: hole.yards,
        notes: hole.notes
      }));
      
      const response = await fetch(`/api/courses/${courseId}/holes/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(apiPayload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Failed to bulk update holes for course ${courseId}:`, errorData);
        return {
          success: false,
          error: {
            message: errorData.message || `Failed to bulk update holes for course ${courseId}`,
            code: 'BULK_UPDATE_HOLES_ERROR',
            details: errorData
          }
        };
      }
      
      const data = await response.json();
      const mappedHoles = (data.data || []).map(mapHoleToDto);
      
      return {
        success: true,
        data: {
          holes: mappedHoles,
          total: mappedHoles.length
        }
      };
    } catch (error) {
      console.error(`Error bulk updating holes for course ${courseId}:`, error);
      return {
        success: false,
        error: {
          message: 'An unexpected error occurred while bulk updating holes',
          code: 'UNEXPECTED_ERROR'
        }
      };
    }
  }
};

export default CoursesApiClient; 