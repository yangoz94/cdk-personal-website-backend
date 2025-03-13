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
   * Formats data to ensure compatibility with JSON serialization (removes BigInt, Date handling).
   */
  private formatData(data: any): any {
    if (data instanceof Date) return data.toISOString();
    if (Array.isArray(data)) return data.map((item) => this.formatData(item));
    if (typeof data === "object" && data !== null) {
      return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, this.formatData(value)]));
    }
    return data;
  }

  /**
   * Creates a standardized Lambda/API Gateway error response.
   */
  public create(message: string, error?: any, statusCode: number = 500) {
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: false,
        message,
        error: error ? this.formatData(error) : undefined,
      }),
    };
  }

  /**
   * Shortcut static method for direct usage without instance handling.
   */
  public static create(message: string, error: any, statusCode: number = 500) {
    return ErrorResponse.getInstance().create(message, error, statusCode);
  }
}
