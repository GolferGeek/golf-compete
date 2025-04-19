/**
 * Common response wrapper for service operations
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
  status: 'success' | 'error';
  timestamp: string;
}

/**
 * Generic pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Generic ordering parameters
 */
export interface OrderingParams {
  column: string;
  direction?: 'asc' | 'desc';
}

/**
 * Common query parameters for data fetching
 */
export interface QueryParams {
  pagination?: PaginationParams;
  ordering?: OrderingParams;
  filters?: Record<string, any>;
  orFilter?: string;
}

/**
 * Generic response with metadata for paginated results
 */
export interface PaginatedResponse<T> extends ServiceResponse<T[]> {
  metadata: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Configuration for service initialization
 */
export interface ServiceConfig {
  debug?: boolean;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
}

/**
 * Retry configuration for operations
 */
export interface RetryConfig {
  retries?: number;
  delayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * Configuration for transaction
 */
export interface TransactionConfig {
  isolationLevel?: 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
  timeout?: number;
}

/**
 * Options for database table operations (e.g., case conversion)
 */
export interface TableOptions {
  /**
   * Whether to return results with camelCase keys (default: true)
   */
  useCamelCase?: boolean;
}

/**
 * Constants for error codes
 */
export const ErrorCodes = {
  // General error codes
  UNKNOWN_ERROR: 'service/unknown-error',
  TIMEOUT: 'service/timeout',
  NETWORK_ERROR: 'service/network-error',
  VALIDATION_ERROR: 'service/validation-error',
  
  // Auth error codes
  AUTH_INVALID_CREDENTIALS: 'auth/invalid-credentials',
  AUTH_USER_NOT_FOUND: 'auth/user-not-found',
  AUTH_EMAIL_IN_USE: 'auth/email-in-use',
  AUTH_WEAK_PASSWORD: 'auth/weak-password',
  AUTH_UNAUTHORIZED: 'auth/unauthorized',
  AUTH_SESSION_EXPIRED: 'auth/session-expired',
  
  // Database error codes
  DB_CONNECTION_ERROR: 'database/connection-error',
  DB_QUERY_ERROR: 'database/query-error',
  DB_TRANSACTION_ERROR: 'database/transaction-error',
  DB_NOT_FOUND: 'database/not-found',
  DB_CONSTRAINT_VIOLATION: 'database/constraint-violation',
  DB_UNIQUE_VIOLATION: 'database/unique-violation',
  
  // Storage error codes
  STORAGE_UPLOAD_ERROR: 'storage/upload-error',
  STORAGE_DOWNLOAD_ERROR: 'storage/download-error',
  STORAGE_DELETE_ERROR: 'storage/delete-error',
  STORAGE_FILE_NOT_FOUND: 'storage/file-not-found',
  STORAGE_QUOTA_EXCEEDED: 'storage/quota-exceeded',
  STORAGE_INVALID_FILE: 'storage/invalid-file',
}; 