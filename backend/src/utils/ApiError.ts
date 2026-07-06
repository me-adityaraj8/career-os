/**
 * Application-level error carrying an HTTP status code and optional machine code.
 * Controllers/services throw these; the central error middleware translates them
 * into JSON responses. Anything that isn't an ApiError is treated as a 500.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, code = 'error', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, 'bad_request', details);
  }
  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message, 'unauthorized');
  }
  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message, 'forbidden');
  }
  static notFound(message = 'Not found'): ApiError {
    return new ApiError(404, message, 'not_found');
  }
  static conflict(message: string): ApiError {
    return new ApiError(409, message, 'conflict');
  }
}
