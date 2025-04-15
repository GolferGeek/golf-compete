import { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import { 
  BaseService, 
  LogLevel,
  ServiceConfig,
  ServiceResponse,
  DatabaseError,
  PaginationParams,
  OrderingParams,
  QueryParams,
  PaginatedResponse,
  ErrorCodes,
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse,
  parseQueryParams,
  keysToSnakeCase,
  keysToCamelCase
} from '../base';

export interface TableOptions {
  /**
   * Whether to return results with camelCase keys (default: true)
   */
  useCamelCase?: boolean;
}

// Define interfaces for Core Resources (replace with actual schema types)
// Ideally these would come from a shared types definition (e.g., generated from Supabase)

// Define Event interface (replace with actual schema types)
interface Event {
  id: string;
  series_id?: string; // Optional link to a series
  name: string;
  description?: string;
  event_date: string; // ISO Timestamp or Date string
  format?: string;
  status: string; // e.g., 'scheduled', 'active', 'completed', 'cancelled'
  course_id?: string;
  created_by: string; // User ID
  created_at: string; // ISO Timestamp
  updated_at: string; // ISO Timestamp
}

interface EventParticipant {
  id: string;
  user_id: string;
  event_id: string;
  status: string; // e.g., 'registered', 'confirmed', 'waitlisted', 'withdrawn', 'no_show'
  registration_date: string; // ISO Timestamp
  tee_time?: string;
  starting_hole?: number;
  group_number?: number;
  handicap_index?: number;
  // Add other relevant fields
}

// Define Course interface (replace with actual schema types)
interface Course {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  website?: string;
  created_by?: string; // User ID, if tracking who added it
  created_at: string; // ISO Timestamp
  updated_at: string; // ISO Timestamp
}

// Define CourseTee interface (replace with actual schema types)
interface CourseTee {
    id: string;
    course_id: string;
    tee_name: string;
    gender: 'Male' | 'Female' | 'Unisex';
    par: number;
    course_rating: number;
    slope_rating: number;
    yardage?: number;
    // Hole-specific details might be in a separate table or JSONB column
}

// Define Round interface
interface Round {
    id: string;
    event_id: string;
    user_id: string;
    course_tee_id: string;
    round_date: string; // ISO Date string
    status: string; // e.g., 'pending', 'in_progress', 'completed', 'dnf'
    handicap_index_used?: number;
    course_handicap?: number;
    net_score?: number;
    gross_score?: number;
    created_at: string;
    updated_at: string;
}

// Define Score interface
interface Score {
    id: string;
    round_id: string;
    hole_number: number; // 1-18
    strokes: number;
    putts?: number;
    fairway_hit?: boolean;
    green_in_regulation?: boolean;
    // Add other stats as needed
}

/**
 * Generic database service for interacting with Supabase database
 */
class DatabaseService extends BaseService {
  constructor(client: SupabaseClient) {
    super(client); // Pass client to BaseService
    this.log(LogLevel.INFO, 'DatabaseService initialized');
  }

  /**
   * Fetch a single record by id
   * @param table The table name
   * @param id The record id
   * @param options Query options
   */
  public async fetchById<T>(
    table: string, 
    id: string | number,
    options: TableOptions = {}
  ): Promise<ServiceResponse<T>> {
    try {
      const { useCamelCase = true } = options;
      
      const { data, error } = await this.client
        .from(table)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_NOT_FOUND);
      }
      
      return createSuccessResponse(useCamelCase ? keysToCamelCase(data) : data);
    } catch (error) {
      return this.handleDatabaseError(error, `Failed to fetch record from ${table}`);
    }
  }

  /**
   * Fetch records with filtering, pagination and ordering
   * @param table The table name
   * @param params Query parameters including pagination, ordering, and filters
   * @param options Query options
   */
  public async fetchRecords<T>(
    table: string,
    params: QueryParams = {},
    options: TableOptions = {}
  ): Promise<PaginatedResponse<T>> {
    try {
      const { useCamelCase = true } = options;
      const { pagination, ordering, filters } = parseQueryParams(params);
      
      // Start building the query
      let query = this.client.from(table).select('*', { count: 'exact' });
      
      // Apply filters if provided
      if (filters && Object.keys(filters).length > 0) {
        const filterEntries = Object.entries(filters);
        for (const [key, value] of filterEntries) {
          if (value === undefined || value === null) continue;
          
          if (typeof value === 'object' && !Array.isArray(value)) {
            const operator = Object.keys(value)[0];
            const operatorValue = value[operator];
            
            switch (operator) {
              case 'eq':
                query = query.eq(key, operatorValue);
                break;
              case 'neq':
                query = query.neq(key, operatorValue);
                break;
              case 'gt':
                query = query.gt(key, operatorValue);
                break;
              case 'gte':
                query = query.gte(key, operatorValue);
                break;
              case 'lt':
                query = query.lt(key, operatorValue);
                break;
              case 'lte':
                query = query.lte(key, operatorValue);
                break;
              case 'like':
                query = query.like(key, `%${operatorValue}%`);
                break;
              case 'ilike':
                query = query.ilike(key, `%${operatorValue}%`);
                break;
              case 'in':
                query = query.in(key, Array.isArray(operatorValue) ? operatorValue : [operatorValue]);
                break;
              case 'contains':
                query = query.contains(key, operatorValue);
                break;
              default:
                break;
            }
          } else {
            query = query.eq(key, value);
          }
        }
      }
      
      // Apply ordering if provided
      if (ordering && ordering.column) {
        const { column, direction = 'asc' } = ordering;
        query = query.order(column, { ascending: direction === 'asc' });
      }
      
      // Apply pagination if provided
      if (pagination) {
        const { limit = 10, offset = 0 } = pagination;
        query = query.range(offset, offset + limit - 1);
      }
      
      // Execute the query
      const { data, error, count } = await query;
      
      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_QUERY_ERROR);
      }
      
      // Transform data if needed
      const transformedData = useCamelCase && data 
        ? data.map(item => keysToCamelCase(item)) 
        : data;
      
      return createPaginatedResponse<T>(
        transformedData || [],
        count || 0,
        pagination || { limit: transformedData?.length || 0, offset: 0 }
      );
    } catch (error) {
      const dbError = this.ensureDatabaseError(error, `Failed to fetch records from ${table}`);
      this.log(LogLevel.ERROR, dbError.message, { error: dbError });
      // Return an error response conforming to PaginatedResponse<T>
      return {
        data: null,
        error: dbError,
        status: 'error',
        timestamp: new Date().toISOString(),
        metadata: { // Add default metadata for error case
          page: params.pagination?.page || 1,
          limit: params.pagination?.limit || 10,
          total: 0,
          totalPages: 0,
          hasMore: false,
        },
      };
    }
  }

  /**
   * Insert a new record
   * @param table The table name
   * @param data The record data
   * @param options Query options
   */
  public async insertRecord<T>(
    table: string,
    data: Partial<T>,
    options: TableOptions = {}
  ): Promise<ServiceResponse<T>> {
    try {
      const { useCamelCase = true } = options;
      
      // Transform data to snake_case for database
      const transformedData = keysToSnakeCase(data);
      
      const { data: result, error } = await this.client
        .from(table)
        .insert(transformedData)
        .select('*')
        .single();
      
      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_CONSTRAINT_VIOLATION);
      }
      
      return createSuccessResponse(useCamelCase ? keysToCamelCase(result) : result);
    } catch (error) {
      return this.handleDatabaseError(error, `Failed to insert record into ${table}`);
    }
  }

  /**
   * Insert multiple records in a batch
   * @param table The table name
   * @param records The records data
   * @param options Query options
   */
  public async insertBatch<T>(
    table: string,
    records: Partial<T>[],
    options: TableOptions = {}
  ): Promise<ServiceResponse<T[]>> {
    try {
      const { useCamelCase = true } = options;
      
      if (!records.length) {
        return createSuccessResponse<T[]>([]);
      }
      
      // Transform data to snake_case for database
      const transformedData = records.map(record => keysToSnakeCase(record));
      
      const { data, error } = await this.client
        .from(table)
        .insert(transformedData)
        .select('*');
      
      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_CONSTRAINT_VIOLATION);
      }
      
      return createSuccessResponse(
        useCamelCase && data ? data.map(item => keysToCamelCase(item)) : data
      );
    } catch (error) {
      return this.handleDatabaseError(error, `Failed to insert records into ${table}`);
    }
  }

  /**
   * Update a record by id
   * @param table The table name
   * @param id The record id
   * @param data The update data
   * @param options Query options
   */
  public async updateRecord<T>(
    table: string,
    id: string | number,
    data: Partial<T>,
    options: TableOptions = {}
  ): Promise<ServiceResponse<T>> {
    try {
      const { useCamelCase = true } = options;
      
      // Transform data to snake_case for database
      const transformedData = keysToSnakeCase(data);
      
      const { data: result, error } = await this.client
        .from(table)
        .update(transformedData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_CONSTRAINT_VIOLATION);
      }
      
      return createSuccessResponse(useCamelCase ? keysToCamelCase(result) : result);
    } catch (error) {
      return this.handleDatabaseError(error, `Failed to update record in ${table}`);
    }
  }

  /**
   * Delete a record by id
   * @param table The table name
   * @param id The record id
   */
  public async deleteRecord<T>(
    table: string,
    id: string | number
  ): Promise<ServiceResponse<null>> {
    try {
      const { error } = await this.client
        .from(table)
        .delete()
        .eq('id', id);
      
      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_NOT_FOUND);
      }
      
      return createSuccessResponse(null);
    } catch (error) {
      return this.handleDatabaseError(error, `Failed to delete record from ${table}`);
    }
  }

  /**
   * Delete multiple records by a filter condition
   * @param table The table name
   * @param column The column name to filter on
   * @param value The value to filter by
   */
  public async deleteWhere<T>(
    table: string,
    column: string,
    value: any
  ): Promise<ServiceResponse<null>> {
    try {
      const { error } = await this.client
        .from(table)
        .delete()
        .eq(column, value);
      
      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_NOT_FOUND);
      }
      
      return createSuccessResponse(null);
    } catch (error) {
      return this.handleDatabaseError(error, `Failed to delete records from ${table}`);
    }
  }

  /**
   * Count records in a table
   * @param table The table name
   * @param filters Optional filters to count specific records
   */
  public async count(
    table: string,
    filters?: Record<string, any>
  ): Promise<ServiceResponse<number>> {
    try {
      let query = this.client.from(table).select('*', { count: 'exact', head: true });
      
      // Apply filters if provided
      if (filters && Object.keys(filters).length > 0) {
        const filterEntries = Object.entries(filters);
        for (const [key, value] of filterEntries) {
          if (value === undefined || value === null) continue;
          query = query.eq(key, value);
        }
      }
      
      const { count, error } = await query;
      
      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_QUERY_ERROR);
      }
      
      return createSuccessResponse(count || 0);
    } catch (error) {
      return this.handleDatabaseError(error, `Failed to count records in ${table}`);
    }
  }

  /**
   * Execute a raw SQL query (use with caution)
   * @param sql The SQL query
   * @param params The query parameters
   */
  public async rawQuery<T>(
    sql: string,
    params: any[] = []
  ): Promise<ServiceResponse<T[]>> {
    try {
      const { data, error } = await this.client.rpc('execute_sql', {
        query: sql,
        params
      });
      
      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_QUERY_ERROR);
      }
      
      return createSuccessResponse(data);
    } catch (error) {
      return this.handleDatabaseError(error, 'Failed to execute raw query');
    }
  }

  /**
   * Fetches event participation details for a specific user, including event info.
   * @param userId The ID of the user.
   * @returns ServiceResponse containing an array of joined event participation data.
   */
  public async fetchUserEventParticipations(userId: string): Promise<ServiceResponse<any[]>> { // Consider defining a specific return type
    try {
      const { data, error } = await this.client
        .from('event_participants')
        .select(`
          participantId:id,
          userId:user_id,
          eventId:event_id,
          participantStatus:status,
          registrationDate:registration_date,
          teeTime:tee_time,
          startingHole:starting_hole,
          groupNumber:group_number,
          handicapIndex:handicap_index,
          event:events (
            eventName:name,
            eventDescription:description,
            eventDate:event_date,
            eventStatus:status,
            courseId:course_id
          )
        `)
        .eq('user_id', userId)
        .not('event', 'is', null); // Ensure the joined event exists

      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_QUERY_ERROR);
      }

      // Flatten the data
      const flattenedData = (data || []).map((item: any) => ({
        participantId: item.participantId,
        userId: item.userId,
        eventId: item.eventId,
        participantStatus: item.participantStatus,
        registrationDate: item.registrationDate,
        teeTime: item.teeTime,
        startingHole: item.startingHole,
        groupNumber: item.groupNumber,
        handicapIndex: item.handicapIndex,
        ...(item.event || {}),
      }));

      // Optionally convert keys to camelCase if not handled by aliases
      // const camelCaseData = flattenedData.map(keysToCamelCase);
      
      return createSuccessResponse(flattenedData);

    } catch (error) {
      return this.handleDatabaseError(error, `Failed to fetch event participations for user ${userId}`);
    }
  }

  /**
   * Creates a new event.
   */
  public async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Event>> {
    return this.insertRecord<Event>('events', eventData);
  }

  /**
   * Gets an event by its ID.
   */
  public async getEventById(eventId: string): Promise<ServiceResponse<Event>> {
    return this.fetchById<Event>('events', eventId);
  }

  /**
   * Updates an existing event.
   */
  public async updateEvent(eventId: string, updateData: Partial<Omit<Event, 'id' | 'created_by' | 'created_at'>>): Promise<ServiceResponse<Event>> {
    return this.updateRecord<Event>('events', eventId, updateData);
  }

  /**
   * Deletes an event by its ID.
   * Note: Consider handling related participants, rounds.
   */
  public async deleteEvent(eventId: string): Promise<ServiceResponse<null>> {
    // TODO: Implement logic to delete related data first? Transactions needed.
    this.log(LogLevel.WARN, `Deleting event ${eventId}. Ensure related data is handled.`);
    return this.deleteRecord('events', eventId);
  }

  /**
   * Fetches events with specific filters, pagination, ordering.
   */
  public async fetchEvents(params: QueryParams = {}, options: TableOptions = {}): Promise<PaginatedResponse<Event>> {
    return this.fetchRecords<Event>('events', params, options);
  }
  
  /**
   * Adds a participant to an event.
   */
  public async addEventParticipant(participantData: Omit<EventParticipant, 'id' | 'registration_date'>): Promise<ServiceResponse<EventParticipant>> {
    return this.insertRecord<EventParticipant>('event_participants', participantData);
  }

  /**
   * Updates an event participant's details (e.g., status, tee time).
   */
  public async updateEventParticipant(participantId: string, updateData: Omit<EventParticipant, 'id' | 'user_id' | 'event_id' | 'registration_date'>): Promise<ServiceResponse<EventParticipant>> {
    return this.updateRecord<EventParticipant>('event_participants', participantId, updateData);
  }

  /**
   * Removes a participant from an event.
   */
  public async removeEventParticipant(participantId: string): Promise<ServiceResponse<null>> {
    return this.deleteRecord('event_participants', participantId);
  }

  /**
   * Gets an event along with its participants.
   */
  public async getEventWithParticipants(eventId: string): Promise<ServiceResponse<Event & { participants: EventParticipant[] }>> {
    try {
      const { data, error } = await this.client
        .from('events')
        .select(`
          *,
          participants: event_participants (*)
        `)
        .eq('id', eventId)
        .single();

      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_NOT_FOUND);
      }
      
      return createSuccessResponse(keysToCamelCase(data) as Event & { participants: EventParticipant[] });
    } catch (error) {
      return this.handleDatabaseError(error, `Failed to fetch event ${eventId} with participants`);
    }
  }

  // --- Course Specific Methods --- 

  /**
   * Creates a new course.
   */
  public async createCourse(courseData: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Course>> {
    return this.insertRecord<Course>('courses', courseData);
  }

  /**
   * Gets a course by its ID.
   */
  public async getCourseById(courseId: string): Promise<ServiceResponse<Course>> {
    return this.fetchById<Course>('courses', courseId);
  }

  /**
   * Updates an existing course.
   */
  public async updateCourse(courseId: string, updateData: Partial<Omit<Course, 'id' | 'created_by' | 'created_at'>>): Promise<ServiceResponse<Course>> {
    return this.updateRecord<Course>('courses', courseId, updateData);
  }

  /**
   * Deletes a course by its ID.
   * Note: Consider handling related events, rounds, tees.
   */
  public async deleteCourse(courseId: string): Promise<ServiceResponse<null>> {
    // TODO: Delete related tees first? Check for events/rounds using this course?
    this.log(LogLevel.WARN, `Deleting course ${courseId}. Ensure related data is handled.`);
    return this.deleteRecord('courses', courseId);
  }

  /**
   * Fetches courses with specific filters, pagination, ordering.
   */
  public async fetchCourses(params: QueryParams = {}, options: TableOptions = {}): Promise<PaginatedResponse<Course>> {
    return this.fetchRecords<Course>('courses', params, options);
  }

  // --- Course Tee Specific Methods --- 

  /**
   * Adds a tee to a course.
   */
  public async addCourseTee(teeData: Omit<CourseTee, 'id'>): Promise<ServiceResponse<CourseTee>> {
    return this.insertRecord<CourseTee>('course_tees', teeData);
  }

  /**
   * Updates a course tee.
   */
  public async updateCourseTee(teeId: string, updateData: Omit<CourseTee, 'id' | 'course_id'>): Promise<ServiceResponse<CourseTee>> {
    return this.updateRecord<CourseTee>('course_tees', teeId, updateData);
  }

  /**
   * Removes a tee from a course.
   */
  public async removeCourseTee(teeId: string): Promise<ServiceResponse<null>> {
    return this.deleteRecord('course_tees', teeId);
  }
  
  /**
   * Gets a course along with its tee information.
   */
    public async getCourseWithTees(courseId: string): Promise<ServiceResponse<Course & { tees: CourseTee[] }>> {
      try {
        const { data, error } = await this.client
          .from('courses')
          .select(`
            *,
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

  // --- Round Specific Methods --- 

  /**
   * Creates a new round.
   */
  public async createRound(roundData: Omit<Round, 'id' | 'created_at' | 'updated_at'>): Promise<ServiceResponse<Round>> {
    return this.insertRecord<Round>('rounds', roundData);
  }

  /**
   * Gets a round by its ID.
   */
  public async getRoundById(roundId: string): Promise<ServiceResponse<Round>> {
    return this.fetchById<Round>('rounds', roundId);
  }

  /**
   * Updates an existing round.
   */
  // Using Omit without Partial as potential workaround for previous type issues
  public async updateRound(roundId: string, updateData: Omit<Round, 'id' | 'event_id' | 'user_id' | 'created_at'>): Promise<ServiceResponse<Round>> {
    return this.updateRecord<Round>('rounds', roundId, updateData);
  }

  /**
   * Deletes a round by its ID.
   * Note: Consider handling related scores.
   */
  public async deleteRound(roundId: string): Promise<ServiceResponse<null>> {
    // TODO: Delete related scores first? Transactions needed.
    this.log(LogLevel.WARN, `Deleting round ${roundId}. Ensure related scores are handled.`);
    // Need to delete scores associated with the round first
    const scoreDeleteResponse = await this.deleteWhere('scores', 'round_id', roundId);
    if (scoreDeleteResponse.error) {
        // Throw or handle error deleting scores
        console.error(`Failed to delete scores for round ${roundId}:`, scoreDeleteResponse.error);
        throw scoreDeleteResponse.error;
    }
    return this.deleteRecord('rounds', roundId);
  }
  
  /**
   * Fetches rounds with specific filters, pagination, ordering.
   */
  public async fetchRounds(params: QueryParams = {}, options: TableOptions = {}): Promise<PaginatedResponse<Round>> {
    return this.fetchRecords<Round>('rounds', params, options);
  }

  // --- Score Specific Methods --- 

  /**
   * Adds a score for a specific hole in a round.
   */
  public async addScore(scoreData: Omit<Score, 'id'>): Promise<ServiceResponse<Score>> {
    // TODO: Add validation? Ensure hole_number is 1-18? Ensure round exists?
    return this.insertRecord<Score>('scores', scoreData);
  }

  /**
   * Updates a score entry.
   */
  // Using Omit without Partial
  public async updateScore(scoreId: string, updateData: Omit<Score, 'id' | 'round_id' | 'hole_number'>): Promise<ServiceResponse<Score>> {
    return this.updateRecord<Score>('scores', scoreId, updateData);
  }

  /**
   * Removes a score entry.
   */
  public async removeScore(scoreId: string): Promise<ServiceResponse<null>> {
    return this.deleteRecord('scores', scoreId);
  }

  /**
   * Gets a round along with all its scores.
   */
  public async getRoundWithScores(roundId: string): Promise<ServiceResponse<Round & { scores: Score[] }>> {
    try {
      const { data, error } = await this.client
        .from('rounds')
        .select(`
          *,
          scores (*)
        `)
        .eq('id', roundId)
        .single();

      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_NOT_FOUND);
      }
      
      // Order scores by hole number if needed
      if (data?.scores) {
        data.scores.sort((a: Score, b: Score) => a.hole_number - b.hole_number);
      }

      return createSuccessResponse(keysToCamelCase(data) as Round & { scores: Score[] });
    } catch (error) {
      return this.handleDatabaseError(error, `Failed to fetch round ${roundId} with scores`);
    }
  }
}

export default DatabaseService; 