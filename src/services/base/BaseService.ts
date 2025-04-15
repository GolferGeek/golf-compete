import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
} 