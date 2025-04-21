import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";

/**
 * Formats Zod errors into a neat, object-based structure.
 * Each key maps to a string containing the error messages for that field.
 */
function formatZodErrorsSimple(error: ZodError): Record<string, string> {
  const flattened = error.flatten();
  const errorMap: Record<string, string> = {};

  for (const [field, errors] of Object.entries(flattened.fieldErrors)) {
    if (errors && errors.length) {
      errorMap[field] = errors.join(", ");
    }
  }

  if (flattened.formErrors && flattened.formErrors.length) {
    errorMap["form"] = flattened.formErrors.join(", ");
  }

  return errorMap;
}

export class ErrorResponse {
  private static instance: ErrorResponse;

  private constructor() {}

  /**
   * Retrieves the singleton instance.
   */
  public static getInstance(): ErrorResponse {
    if (!ErrorResponse.instance) {
      ErrorResponse.instance = new ErrorResponse();
    }
    return ErrorResponse.instance;
  }

  /**
   * Formats data for JSON serialization (handles Date, BigInt, etc.).
   */
  private formatData(data: any): any {
    if (data instanceof Date) return data.toISOString();
    if (Array.isArray(data)) return data.map((item) => this.formatData(item));
    if (typeof data === "object" && data !== null) {
      return Object.fromEntries(
        Object.entries(data).map(([key, value]) => [
          key,
          this.formatData(value),
        ])
      );
    }
    return data;
  }

  /**
   * Creates a standardized Lambda/API Gateway error response.
   * If the error is a ZodError, it will use formatZodErrorsSimple to produce a concise error map.
   */
  public create(
    message: string,
    error?: any,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR
  ) {
    let details: any;
    if (error instanceof ZodError) {
      details = formatZodErrorsSimple(error);
    } else if (error && typeof error === "object") {
      details = this.formatData(error);
    } else {
      details = error;
    }

    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        /* Include CORS headers to ensure cross-origin requests work */
        "Access-Control-Allow-Origin": "*", // Use a specific origin in production
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      },
      body: JSON.stringify({
        success: false,
        message,
        details,
      }),
    };
  }

  /**
   * Shortcut static method for direct usage without instance handling.
   */
  public static create(
    message: string,
    error: any,
    statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR
  ) {
    return ErrorResponse.getInstance().create(message, error, statusCode);
  }
}
