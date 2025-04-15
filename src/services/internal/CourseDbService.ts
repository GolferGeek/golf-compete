import { SupabaseClient } from '@supabase/supabase-js';
import { 
    BaseService, 
    LogLevel,
    ServiceResponse,
    DatabaseError,
    ErrorCodes,
    PaginatedResponse,
    QueryParams,
    TableOptions,
    createSuccessResponse,
    keysToCamelCase
} from '../base'; 
import { type Course, type CourseTee } from '@/types/database'; // Import shared types

// Explicitly define the type for partial tee updates
type UpdateCourseTeeData = Partial<Omit<CourseTee, 'id' | 'course_id'>>;

/**
 * Database service specifically for Course-related operations.
 */
class CourseDbService extends BaseService {
  constructor(client: SupabaseClient) {
    super(client);
    this.log(LogLevel.INFO, 'CourseDbService initialized');
  }

  // --- Course Specific Methods --- 

  public async createCourse(courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Course>> {
    return this.insertRecord<Course>('courses', courseData);
  }

  public async getCourseById(courseId: string): Promise<ServiceResponse<Course>> {
    return this.fetchById<Course>('courses', courseId);
  }

  /**
   * Updates an existing course.
   */
  public async updateCourse(courseId: string, updateData: Partial<Omit<Course, 'id' | 'created_by' | 'created_at' | 'updated_at'>>): Promise<ServiceResponse<Course>> {
    return this.updateRecord<Course>('courses', courseId, updateData);
  }

  public async deleteCourse(courseId: string): Promise<ServiceResponse<null>> {
    this.log(LogLevel.WARN, `Deleting course ${courseId}. Ensure related data is handled.`);
    // TODO: Delete related tees first? Check events/rounds? Transaction needed.
    return this.deleteRecord('courses', courseId);
  }

  public async fetchCourses(params: QueryParams = {}, options: TableOptions = {}): Promise<PaginatedResponse<Course>> {
    return this.fetchRecords<Course>('courses', params, options);
  }

  // --- Course Tee Specific Methods --- 

  public async addCourseTee(teeData: Omit<CourseTee, 'id'>): Promise<ServiceResponse<CourseTee>> {
    return this.insertRecord<CourseTee>('course_tees', teeData);
  }

  /**
   * Updates a course tee.
   */
  public async updateCourseTee(teeId: string, updateData: UpdateCourseTeeData): Promise<ServiceResponse<CourseTee>> {
    return this.updateRecord<CourseTee>('course_tees', teeId, updateData);
  }

  public async removeCourseTee(teeId: string): Promise<ServiceResponse<null>> {
    return this.deleteRecord('course_tees', teeId);
  }
  
  public async getCourseWithTees(courseId: string): Promise<ServiceResponse<Course & { tees: CourseTee[] }>> {
      try {
        const { data, error } = await this.client
          .from('courses')
          .select(`*,
                   tees: course_tees (*)
                 `)
          .eq('id', courseId)
          .single();
  
        if (error) {
          throw this.createDatabaseError(error, ErrorCodes.DB_NOT_FOUND);
        }
        return createSuccessResponse(keysToCamelCase(data) as Course & { tees: CourseTee[] });
      } catch (error) {
        return this.handleDatabaseError(error, `Failed to fetch course ${courseId} with tees`);
      }
    }
}

export default CourseDbService; 