// src/lib/apiClient/courses.ts
import { type Course, type CourseTee } from '@/types/database';
import { type PaginatedResponse } from '@/services/base';
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