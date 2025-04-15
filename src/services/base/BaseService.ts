import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { 
    ServiceResponse, 
    PaginatedResponse, 
    QueryParams, 
    TableOptions,
    ErrorCodes
} from './types';
import { 
    createSuccessResponse, 
    createErrorResponse, 
    createPaginatedResponse,
    parseQueryParams,
    keysToSnakeCase,
    keysToCamelCase
} from './utils';

/**
 * Base error class for service-related errors
 */
export class ServiceError extends Error {
  public readonly code: string;
  public readonly originalError?: Error;

  constructor(message: string, code: string, originalError?: Error) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Auth-specific errors
 */
export class AuthError extends ServiceError {
  constructor(message: string, code: string = 'auth/error', originalError?: Error) {
    super(message, code, originalError);
  }
}

/**
 * Database-specific errors
 */
export class DatabaseError extends ServiceError {
  constructor(message: string, code: string = 'database/error', originalError?: Error) {
    super(message, code, originalError);
  }
}

/**
 * Storage-specific errors
 */
export class StorageError extends ServiceError {
  constructor(message: string, code: string = 'storage/error', originalError?: Error) {
    super(message, code, originalError);
  }
}

/**
 * Log levels for consistent logging
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Base service class that provides common functionality for all services
 */
export abstract class BaseService {
  public readonly client: SupabaseClient;
  protected isServerSide: boolean;

  constructor(client: SupabaseClient) {
    if (!client) {
      throw new Error('SupabaseClient instance is required for BaseService.');
    }
    this.isServerSide = typeof window === 'undefined';
    this.client = client;
  }

  /**
   * Log a message with the specified level
   */
  protected log(level: LogLevel, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const serviceName = this.constructor.name;
    
    const logEntry = {
      timestamp,
      level,
      service: serviceName,
      message,
      data
    };

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logEntry);
        break;
      case LogLevel.INFO:
        console.info(logEntry);
        break;
      case LogLevel.WARN:
        console.warn(logEntry);
        break;
      case LogLevel.ERROR:
        console.error(logEntry);
        break;
    }
  }

  /**
   * Handle errors consistently across services
   */
  protected handleError<T extends Error>(
    error: T, 
    message: string, 
    errorClass: new (message: string, code: string, originalError?: Error) => ServiceError = ServiceError,
    code: string = 'service/error'
  ): never {
    this.log(LogLevel.ERROR, message, { error });
    
    const serviceError = new errorClass(message, code, error);
    throw serviceError;
  }

  /**
   * Execute an async operation with automatic retry
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      retries?: number;
      delayMs?: number;
      backoffFactor?: number;
      shouldRetry?: (error: Error, attempt: number) => boolean;
    } = {}
  ): Promise<T> {
    const { 
      retries = 3, 
      delayMs = 500, 
      backoffFactor = 2,
      shouldRetry = () => true
    } = options;

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < retries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if we should retry
        if (attempt >= retries || !shouldRetry(lastError, attempt)) {
          break;
        }
        
        // Wait before retrying with exponential backoff
        const delay = delayMs * Math.pow(backoffFactor, attempt);
        this.log(LogLevel.WARN, `Operation failed, retrying (${attempt + 1}/${retries})...`, { error });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Execute an operation with a timeout
   */
  protected async withTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number = 10000
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new ServiceError('Operation timed out', 'service/timeout'));
        }, timeoutMs);
      })
    ]);
  }

  /**
   * Fetch a single record by id
   */
  public async fetchById<T>(
    table: string, 
    id: string | number,
    options: TableOptions = {}
  ): Promise<ServiceResponse<T>> {
    try {
      const { useCamelCase = true } = options;
      const { data, error } = await this.client.from(table).select('*').eq('id', id).single();
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
   */
  public async fetchRecords<T>(
    table: string,
    params: QueryParams = {},
    options: TableOptions = {}
  ): Promise<PaginatedResponse<T>> {
    try {
      const { useCamelCase = true } = options;
      const { pagination, ordering, filters, orFilter } = parseQueryParams(params);
      let query = this.client.from(table).select('*', { count: 'exact' });
      
      // Apply standard AND filters
      if (filters) {
         for (const [key, value] of Object.entries(filters)) {
           if (value === undefined || value === null) continue;
           
           // If value is an object, assume it's a filter object for match()
           // This handles { eq: ... }, { gte: ... }, { contains: ... }, etc. more directly?
           if (typeof value === 'object' && !Array.isArray(value)) {
                // Let Supabase handle the object-based filter via match()
                // This assumes keys in the value object are valid operators (gte, lte, contains, etc.)
                // We might need specific handling if match doesn't work for all operators.
                // Revisit this if specific operators fail.
                // For now, simplify by applying the whole object.
                
                // Can't directly use match with complex operators like gte/lte inside.
                // Reverting to iterating operators, but maybe handle contains separately.
                
                let appliedFilter = false;
                for (const [operator, operatorValue] of Object.entries(value)) {
                    if (operatorValue === undefined || operatorValue === null) continue;
                    appliedFilter = true; // Mark that we found at least one operator
                    switch (operator) {
                        case 'eq': query = query.eq(key, operatorValue); break;
                        case 'neq': query = query.neq(key, operatorValue); break;
                        case 'gt': query = query.gt(key, operatorValue); break;
                        case 'gte': query = query.gte(key, operatorValue); break;
                        case 'lt': query = query.lt(key, operatorValue); break;
                        case 'lte': query = query.lte(key, operatorValue); break;
                        case 'like': query = query.like(key, `%${operatorValue}%`); break;
                        case 'ilike': query = query.ilike(key, `%${operatorValue}%`); break;
                        case 'in': query = query.in(key, Array.isArray(operatorValue) ? operatorValue : [operatorValue]); break;
                        /* // Temporarily commenting out contains due to persistent type errors
                        case 'contains': 
                            if (typeof operatorValue === 'string' || typeof operatorValue === 'object') {
                                query = query.contains(key, operatorValue); 
                            } else {
                                console.warn(`Skipping contains filter for key '${key}': invalid value type.`);
                            }
                            break;
                        */
                    }
                }
                // If the object had no valid operators, maybe treat key=value as eq?
                // if (!appliedFilter) { query = query.eq(key, value); } // Risky assumption
           } else {
             // Simple equality filter
             query = query.eq(key, value);
           }
         }
      }

      // Apply OR filter if provided
      if (orFilter && typeof orFilter === 'string' && orFilter.trim() !== '') {
          query = query.or(orFilter.trim());
      }
      
      // Apply ordering
      if (ordering?.column) {
        query = query.order(ordering.column, { ascending: ordering.direction !== 'desc' });
      }
      // Apply pagination
      if (pagination) {
        const { limit = 10, offset = 0 } = pagination;
        query = query.range(offset, offset + limit - 1);
      }
      const { data, error, count } = await query;
      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_QUERY_ERROR);
      }
      const transformedData = useCamelCase && data ? data.map(item => keysToCamelCase(item)) : data;
      return createPaginatedResponse<T>(
        transformedData || [],
        count || 0,
        pagination || { limit: transformedData?.length || 0, offset: 0 }
      );
    } catch (error) {
      const dbError = this.ensureDatabaseError(error, `Failed to fetch records from ${table}`);
      this.log(LogLevel.ERROR, dbError.message, { error: dbError });
      // Return paginated error format
      return { data: null, error: dbError, status: 'error', timestamp: new Date().toISOString(), metadata: { page: params.pagination?.page || 1, limit: params.pagination?.limit || 10, total: 0, totalPages: 0, hasMore: false } };
    }
  }

  /**
   * Insert a new record
   */
  public async insertRecord<T>(
    table: string,
    data: Partial<T>,
    options: TableOptions = {}
  ): Promise<ServiceResponse<T>> {
    try {
      const { useCamelCase = true } = options;
      const transformedData = keysToSnakeCase(data);
      const { data: result, error } = await this.client.from(table).insert(transformedData).select('*').single();
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
   */
  public async insertBatch<T>(
    table: string,
    records: Partial<T>[],
    options: TableOptions = {}
  ): Promise<ServiceResponse<T[]>> {
    try {
      const { useCamelCase = true } = options;
      if (!records.length) return createSuccessResponse<T[]>([]);
      const transformedData = records.map(record => keysToSnakeCase(record));
      const { data, error } = await this.client.from(table).insert(transformedData).select('*');
      if (error) {
        throw this.createDatabaseError(error, ErrorCodes.DB_CONSTRAINT_VIOLATION);
      }
      return createSuccessResponse(useCamelCase && data ? data.map(item => keysToCamelCase(item)) : data);
    } catch (error) {
      return this.handleDatabaseError(error, `Failed to insert records into ${table}`);
    }
  }

  /**
   * Update a record by id
   */
  public async updateRecord<T>(
    table: string,
    id: string | number,
    // Note: Using Partial<T> here as removing it caused issues before
    data: Partial<T>, 
    options: TableOptions = {}
  ): Promise<ServiceResponse<T>> {
    try {
      const { useCamelCase = true } = options;
      const transformedData = keysToSnakeCase(data);
      const { data: result, error } = await this.client.from(table).update(transformedData).eq('id', id).select('*').single();
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
   */
  // Changed T constraint to allow null response type
  public async deleteRecord(
    table: string,
    id: string | number
  ): Promise<ServiceResponse<null>> { 
    try {
      const { error } = await this.client.from(table).delete().eq('id', id);
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
   */
  // Changed T constraint
  public async deleteWhere(
    table: string,
    column: string,
    value: any
  ): Promise<ServiceResponse<null>> { 
    try {
      const { error } = await this.client.from(table).delete().eq(column, value);
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
   */
  public async count(
    table: string,
    filters?: Record<string, any>
  ): Promise<ServiceResponse<number>> {
    try {
      let query = this.client.from(table).select('*', { count: 'exact', head: true });
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
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
  
  // --- Database Error Handling Helpers ---
  
  /**
   * Create PostgrestError to DatabaseError adapter
   */
  protected createDatabaseError(error: PostgrestError, code: string = ErrorCodes.DB_QUERY_ERROR): DatabaseError {
    return new DatabaseError(error.message, code, error);
  }

  /**
   * Handle database-specific errors
   */
  protected handleDatabaseError<T>(error: any, message: string): ServiceResponse<T> {
    const dbError = this.ensureDatabaseError(error, message);
    this.log(LogLevel.ERROR, dbError.message, { error: dbError });
    return createErrorResponse<T>(dbError);
  }

  /**
   * Ensure an error is a DatabaseError instance
   */
  protected ensureDatabaseError(error: any, defaultMessage: string): DatabaseError {
    if (error instanceof DatabaseError) return error;
    if (error && typeof error === 'object' && 'message' in error && 'code' in error && 'details' in error && 'hint' in error) {
      return this.createDatabaseError(error as PostgrestError);
    }
    return new DatabaseError(
      error?.message || defaultMessage,
      error?.code || ErrorCodes.DB_QUERY_ERROR,
      error instanceof Error ? error : new Error(String(error))
    );
  }
} 