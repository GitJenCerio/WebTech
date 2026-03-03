/**
 * Centralized API Error Handling
 * MO-IT149 Milestone 2 - Consistent error responses across all API routes
 */
import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'BAD_REQUEST'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export interface ApiErrorResponse {
  error: string;
  code?: ApiErrorCode;
  details?: unknown;
  statusCode: number;
}

/** Custom API error with status code and optional details */
export class ApiError extends Error {
  statusCode: number;
  code: ApiErrorCode;
  details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ApiErrorCode = 'INTERNAL_ERROR',
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/** 400 Bad Request */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/** 401 Unauthorized */
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/** 403 Forbidden */
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/** 404 Not Found */
export class NotFoundError extends ApiError {
  constructor(message: string = 'Not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/** 409 Conflict */
export class ConflictError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 409, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

/**
 * Handle an error and return a NextResponse.
 * Use in API route catch blocks: return handleApiError(error);
 */
export function handleApiError(error: unknown, req?: Request): NextResponse {
  if (error instanceof ApiError) {
    const body: ApiErrorResponse = {
      error: error.message,
      code: error.code,
      details: error.details,
      statusCode: error.statusCode,
    };
    return NextResponse.json(body, { status: error.statusCode });
  }

  const err = error instanceof Error ? error : new Error(String(error));
  const isDev = process.env.NODE_ENV === 'development';

  // Don't leak internal details in production
  const message = isDev ? err.message : 'An unexpected error occurred. Please try again later.';

  if (req) {
    console.error('[API Error]', err.message, { path: req.url, stack: err.stack });
  } else {
    console.error('[API Error]', err.message, err.stack);
  }

  return NextResponse.json(
    {
      error: message,
      code: 'INTERNAL_ERROR' as ApiErrorCode,
      statusCode: 500,
    } satisfies ApiErrorResponse,
    { status: 500 }
  );
}

/**
 * Wrap an async API handler with centralized error handling.
 * Usage: export const POST = withApiErrorHandler(async (request) => { ... });
 */
export function withApiErrorHandler<T extends Request>(
  handler: (request: T, context?: unknown) => Promise<NextResponse>
) {
  return async (request: T, context?: unknown): Promise<NextResponse> => {
    try {
      return await handler(request, context);
    } catch (error) {
      return handleApiError(error, request);
    }
  };
}
