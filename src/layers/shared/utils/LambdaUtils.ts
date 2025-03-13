import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ErrorResponse } from "@utils/ErrorResponse.js";

export class LambdaUtils {
  /**
   * Validates and parses the API Gateway event body.
   * Returns the parsed body or an API Gateway error response.
   */
  static validateRequest(event: APIGatewayProxyEvent): Record<string, unknown> | APIGatewayProxyResult {
    if (!event.body) {
      console.error("Request body is missing");
      return ErrorResponse.create("Request body is missing", null, 400);
    }

    try {
      const parsedBody = JSON.parse(event.body);
      if (typeof parsedBody !== "object" || parsedBody === null) {
        return ErrorResponse.create("Parsed body is not a valid JSON object", null, 400);
      }
      return parsedBody;
    } catch (error) {
      console.error("Invalid JSON format in request body", error);
      return ErrorResponse.create("Invalid JSON format in request body", null, 400);
    }
  }
}
