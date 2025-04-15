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
   * Fetches series participation details for a specific user, including series info.
   * @param userId The ID of the user.
   * @returns ServiceResponse containing an array of joined series participation data.
   */
  public async fetchUserSeriesParticipations(userId: string): Promise<ServiceResponse<any[]>> { // Consider defining a specific return type
    try {
      const { data, error } = await this.client
        .from('series_participants')
        .select(`
          participantId:id,
          userId:user_id,
          seriesId:series_id,
          role,
          participantStatus:status,
          joinedAt:joined_at,
          series:series_id (
            seriesName:name,
            seriesDescription:description,
            seriesStartDate:start_date,
            seriesEndDate:end_date,
            seriesStatus:status,
            seriesCreatedBy:created_by
          )
        `)
        .eq('user_id', userId)
        .not('series', 'is', null); // Ensure the joined series exists

      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_QUERY_ERROR);
      }

      // Flatten the data
      const flattenedData = (data || []).map((item: any) => ({
          participantId: item.participantId,
          userId: item.userId,
          seriesId: item.seriesId,
          role: item.role,
          participantStatus: item.participantStatus,
          joinedAt: item.joinedAt,
          ...(item.series || {}),
      }));

      // Optionally convert keys to camelCase if not handled by aliases
      // const camelCaseData = flattenedData.map(keysToCamelCase);
      
      return createSuccessResponse(flattenedData);

    } catch (error) {
      return this.handleDatabaseError(error, `Failed to fetch series participations for user ${userId}`);
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
            eventFormat:format,
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
   * Create PostgrestError to DatabaseError adapter
   */
  private createDatabaseError(error: PostgrestError, code: string = ErrorCodes.DB_QUERY_ERROR): DatabaseError {
    return new DatabaseError(
      error.message,
      code,
      error
    );
  }

  /**
   * Handle database-specific errors
   */
  private handleDatabaseError<T>(error: any, message: string): ServiceResponse<T> {
    const dbError = this.ensureDatabaseError(error, message);
    this.log(LogLevel.ERROR, dbError.message, { error: dbError });
    return createErrorResponse<T>(dbError);
  }

  /**
   * Ensure an error is a DatabaseError instance
   */
  private ensureDatabaseError(error: any, defaultMessage: string): DatabaseError {
    if (error instanceof DatabaseError) {
      return error;
    }
    // If it's a PostgrestError, create a specific DatabaseError
    if (error && typeof error === 'object' && 'message' in error && 'code' in error && 'details' in error && 'hint' in error) {
      return this.createDatabaseError(error as PostgrestError);
    }
    // Otherwise, create a generic DatabaseError
    return new DatabaseError(
      error?.message || defaultMessage,
      error?.code || ErrorCodes.DB_QUERY_ERROR,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

export default DatabaseService; 