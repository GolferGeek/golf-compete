import { ServiceResponse, PaginatedResponse, PaginationParams, QueryParams } from './types';

/**
 * Create a standard success response
 */
export function createSuccessResponse<T>(data: T): ServiceResponse<T> {
  return {
    data,
    error: null,
    status: 'success',
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a standard error response
 */
export function createErrorResponse<T>(error: Error): ServiceResponse<T> {
  return {
    data: null,
    error,
    status: 'error',
    timestamp: new Date().toISOString()
  };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    error: null,
    status: 'success',
    timestamp: new Date().toISOString(),
    metadata: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  };
}

/**
 * Apply pagination to a query
 */
export function applyPagination<T>(
  items: T[],
  params: PaginationParams
): { items: T[]; total: number } {
  const page = params.page || 1;
  const limit = params.limit || 10;
  const offset = params.offset || (page - 1) * limit;

  const paginatedItems = items.slice(offset, offset + limit);
  
  return {
    items: paginatedItems,
    total: items.length
  };
}

/**
 * Parse query parameters with defaults
 */
export function parseQueryParams(params: QueryParams = {}): QueryParams {
  return {
    pagination: {
      page: 1,
      limit: 10,
      ...(params.pagination || {})
    },
    ordering: params.ordering,
    filters: params.filters || {}
  };
}

/**
 * Sleep for the specified duration (useful for retry mechanisms)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if running on the server side
 */
export function isServerSide(): boolean {
  return typeof window === 'undefined';
}

/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
}

/**
 * Convert Supabase error to a more user-friendly message
 */
export function formatSupabaseErrorMessage(error: any): string {
  if (!error) return 'Unknown error occurred';
  
  // Handle Supabase error objects
  if (error.message) return error.message;
  
  // Handle plain error strings
  if (typeof error === 'string') return error;
  
  // Default fallback
  return 'An unexpected error occurred';
}

/**
 * Format database column names to camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Format JavaScript property names to snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/**
 * Convert object keys from snake_case to camelCase
 */
export function keysToCamelCase(obj: Record<string, any>): Record<string, any> {
  if (Array.isArray(obj)) {
    return obj.map(v => keysToCamelCase(v));
  }
  
  if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = toCamelCase(key);
      result[camelKey] = keysToCamelCase(obj[key]);
      return result;
    }, {} as Record<string, any>);
  }
  
  return obj;
}

/**
 * Convert object keys from camelCase to snake_case
 */
export function keysToSnakeCase(obj: Record<string, any> | null | undefined): Record<string, any> | null | undefined {
  // Handle null or undefined
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(v => keysToSnakeCase(v));
  }
  
  // Check for objects - use typeof check instead of constructor property
  if (typeof obj === 'object' && obj !== null) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = toSnakeCase(key);
      result[snakeKey] = keysToSnakeCase(obj[key]);
      return result;
    }, {} as Record<string, any>);
  }
  
  // Return primitive values as is
  return obj;
} 