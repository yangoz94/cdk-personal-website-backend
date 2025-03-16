import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ErrorResponse } from "@utils/ErrorResponse.js";
import { StatusCodes } from "http-status-codes";
import { logger } from "./Logger.js";
import { BadRequestError, BaseError, InvalidJSONError, MissingRequestBodyError } from "../errors/errors.js";

export class LambdaUtils {
  /**
   * Validates and parses the API Gateway event body.
   * Returns the parsed body.
   * Throws an error if the body is missing or invalid.
   */
  static validateRequestsWithBody(event: APIGatewayProxyEvent): Record<string, unknown> {
    if (!event.body) {
      throw new MissingRequestBodyError();
    }

    try {
      const parsedBody = JSON.parse(event.body);
      if (typeof parsedBody !== "object" || parsedBody === null) {
        throw new InvalidJSONError();
      }
      return parsedBody;
    } catch (error) {
      throw new InvalidJSONError();
    }
  }
}
