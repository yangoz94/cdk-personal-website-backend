export class SuccessfulAPIResponse {
  private static instance: SuccessfulAPIResponse;

  private constructor() {}

  /**
   * Retrieves the singleton instance.
   */
  public static getInstance(): SuccessfulAPIResponse {
    if (!SuccessfulAPIResponse.instance) {
      SuccessfulAPIResponse.instance = new SuccessfulAPIResponse();
    }
    return SuccessfulAPIResponse.instance;
  }

  /**
   * Recursively formats data:
   * - Converts Date values to ISO strings.
   * - Converts Decimal values to strings.
   */
  private formatData(data: any): any {
    if (data instanceof Date) return data.toISOString();

    if (Array.isArray(data)) {
      return data.map(this.formatData.bind(this));
    }

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
   * Creates a standardized API Gateway Lambda response.
   */
  public create(data: any, message: string, statusCode: number = 200) {
    return {
      statusCode,
      headers: {
        "Content-Type": "application/json",
        /* Include CORS headers to ensure cross-origin requests work */
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers":
          "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      },
      body: JSON.stringify({
        success: true,
        message,
        data: this.formatData(data),
      }),
    };
  }

  /**
   * Static helper for quick usage.
   */
  public static create(data: any, message: string, statusCode: number = 200) {
    return SuccessfulAPIResponse.getInstance().create(
      data,
      message,
      statusCode
    );
  }
}
