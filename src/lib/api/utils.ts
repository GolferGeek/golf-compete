import { NextResponse, type NextRequest } from 'next/server';
import { ZodError, z } from 'zod';

/**
 * Standard success response format
 */
export interface SuccessResponse<T> {
  status: 'success';
  data: T;
  timestamp: string;
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  status: 'error';
  error: {
    code: string; // e.g., 'VALIDATION_ERROR', 'UNAUTHORIZED', 'INTERNAL_SERVER_ERROR'
    message: string;
    details?: any; // Optional additional details (e.g., validation errors)
  };
  timestamp: string;
}

/**
 * Creates a standardized success response.
 * @param data The data payload for the success response.
 * @param status HTTP status code (default: 200).
 * @returns A NextResponse object with the standardized success payload.
 */
export function createSuccessApiResponse<T>(
  data: T,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  // When data is an object with nested data and metadata properties,
  // avoid double nesting and directly use the data property
  if (data && typeof data === 'object' && 'data' in data && 'metadata' in data) {
    return NextResponse.json(
      {
        status: 'success' as const,
        data: (data as any).data,
        metadata: (data as any).metadata,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }
  
  // For other data types, keep the standard format
  return NextResponse.json(
    {
      status: 'success' as const,
      data,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Creates a standardized error response.
 * @param message The error message.
 * @param code A specific error code string.
 * @param status HTTP status code (default: 500).
 * @param details Optional additional error details.
 * @returns A NextResponse object with the standardized error payload.
 */
export function createErrorApiResponse(
  message: string,
  code: string,
  status: number = 500,
  details?: any
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      status: 'error' as const,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Validates data against a Zod schema and returns either the parsed data
 * or a standardized validation error response.
 *
 * @param schema The Zod schema to validate against.
 * @param data The data to validate (e.g., request body or query params).
 * @returns A promise that resolves to either the validated data or a NextResponse error.
 */
export async function validateRequestData<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): Promise<z.infer<T> | NextResponse<ErrorResponse>> {
  try {
    const parsedData = await schema.parseAsync(data);
    return parsedData as z.infer<T>;
  } catch (error) {
    if (error instanceof ZodError) {
      console.error('Validation Error:', error.errors);
      return createErrorApiResponse(
        'Validation failed',
        'VALIDATION_ERROR',
        400, // Bad Request
        error.errors // Provide detailed validation errors
      );
    }
    // Handle non-Zod errors during validation (less common)
    console.error('Unexpected Validation Error:', error);
    return createErrorApiResponse(
      error instanceof Error ? error.message : 'An unexpected error occurred during validation',
      'INTERNAL_SERVER_ERROR',
      500
    );
  }
}

/**
 * Extracts and validates JSON body from a NextRequest.
 *
 * @param request The NextRequest object.
 * @param schema The Zod schema to validate the body against.
 * @returns A promise resolving to the validated data or an error NextResponse.
 */
export async function validateRequestBody<T extends z.ZodTypeAny>(
  request: Request, // Use standard Request type
  schema: T
): Promise<z.infer<T> | NextResponse<ErrorResponse>> {
  let body: unknown;
  try {
    // Check if body exists and has content
    if (!request.body) {
      return createErrorApiResponse('Request body is missing', 'VALIDATION_ERROR', 400);
    }
    // Use text() first to handle empty body gracefully
    const textBody = await request.text();
    if (!textBody) {
       return createErrorApiResponse('Request body is empty', 'VALIDATION_ERROR', 400);
    }
    body = JSON.parse(textBody);
  } catch (error) {
    return createErrorApiResponse('Invalid JSON format in request body', 'INVALID_JSON', 400);
  }
  
  return validateRequestData(schema, body);
}

/**
 * Extracts and validates query parameters from a NextRequest URL.
 *
 * @param request The NextRequest object.
 * @param schema The Zod schema to validate the query parameters against.
 * @returns A promise resolving to the validated query parameters or an error NextResponse.
 */
export async function validateQueryParams<T extends z.ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T> | NextResponse<ErrorResponse>> {
  const { searchParams } = new URL(request.url);
  const queryParams: Record<string, string | string[]> = {};

  // Convert URLSearchParams to a plain object
  searchParams.forEach((value, key) => {
    const existing = queryParams[key];
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        queryParams[key] = [existing, value];
      }
    } else {
      queryParams[key] = value;
    }
  });

  return validateRequestData(schema, queryParams);
} 