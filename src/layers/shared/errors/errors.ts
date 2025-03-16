import { StatusCodes } from "http-status-codes";
/**
 * Base error class for all application errors
 */
export class BaseError extends Error {
  public statusCode: number;
  public error: string;
  public metadata?: any;

  constructor(statusCode: number, message: string, error: string, metadata?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.error = error;
    this.metadata = metadata;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Specific error classes inheriting from BaseError
 */
export class BadRequestError extends BaseError {
  constructor(message = "Bad Request", metadata?: any) {
    super(StatusCodes.BAD_REQUEST, message, "BAD_REQUEST", metadata);
  }
}

export class NotFoundError extends BaseError {
  constructor(message = "Not Found", metadata?: any) {
    super(StatusCodes.NOT_FOUND, message, "NOT_FOUND", metadata);
  }
}

export class InternalServerError extends BaseError {
  constructor(message = "Internal Server Error", metadata?: any) {
    super(StatusCodes.INTERNAL_SERVER_ERROR, message, "INTERNAL_SERVER_ERROR", metadata);
  }
}

export class InvalidBodyError extends BaseError {
  constructor(message = "Invalid Request Body", metadata?: any) {
    super(StatusCodes.BAD_REQUEST, message, "INVALID_REQUEST_BODY", metadata);
  }
}

export class MissingRequestBodyError extends BaseError {
  constructor(message = "Missing Request Body", metadata?: any) {
    super(StatusCodes.BAD_REQUEST, message, "MISSING_REQUEST_BODY", metadata);
  }
}

export class InvalidJSONError extends BaseError {
  constructor(message = "Invalid JSON", metadata?: any) {
    super(StatusCodes.BAD_REQUEST, message, "INVALID_JSON", metadata);
  }
}

/* Specific Errors */
export class ProjectNotFoundError extends BaseError {
  constructor(message = "Project not found", metadata?: any) {
    super(StatusCodes.NOT_FOUND, message, "PROJECT_NOT_FOUND", metadata);
  }
}
