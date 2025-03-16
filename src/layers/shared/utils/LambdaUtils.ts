import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ErrorResponse } from "@utils/ErrorResponse.js";
import { StatusCodes } from "http-status-codes";
import { logger } from "./Logger.js";

export class LambdaUtils {
  /**
   * Validates and parses the API Gateway event body.
   * Returns the parsed body or an API Gateway error response.
   */
  static validateRequest(event: APIGatewayProxyEvent): Record<string, unknown> | APIGatewayProxyResult {
    if (!event.body) {
      logger.error("Request body is missing");
      return ErrorResponse.create("Request body is missing", null, StatusCodes.BAD_REQUEST);
    }

    try {
      const parsedBody = JSON.parse(event.body);
      if (typeof parsedBody !== "object" || parsedBody === null) {
        return ErrorResponse.create("Parsed body is NOT a valid JSON object", null, StatusCodes.BAD_REQUEST);
      }
      return parsedBody;
    } catch (error) {
      logger.error("Invalid JSON format in request body", error);
      return ErrorResponse.create("Invalid JSON format in request body", null, StatusCodes.BAD_REQUEST);
    }
  }
}
