import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { ErrorResponse } from "@utils/ErrorResponse.js";
import { logger } from "@utils/Logger.js";
import { StatusCodes } from "http-status-codes";
import { ProjectService } from "src/layers/shared/services/ProjectService.js";
import { SuccessfulAPIResponse } from "@utils/SuccesfulApiResponse.js";

const projectService = new ProjectService();

/* Define a schema for validating query parameters only */
const querySchema = z.object({
  limit: z
    .string()
    .optional()
    .refine((value) => value === undefined || (!isNaN(parseInt(value, 10)) && parseInt(value, 10) > 0), {
      message: "Limit must be a number greater than 0",
    }),
  lastKey: z.string().optional(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    /* Extract and validate query parameters directly */
    const queryParams = event.queryStringParameters || {};
    const parsedQuery = querySchema.safeParse(queryParams);

    if (!parsedQuery.success) {
      logger.error("Invalid query parameters:", parsedQuery.error.format());
      return ErrorResponse.create("Invalid query parameters", parsedQuery.error.format(), StatusCodes.BAD_REQUEST);
    }

    const { limit, lastKey } = parsedQuery.data;
    /* Convert limit to a number (defaults to 10 if not provided) */
    const limitNumber = limit ? parseInt(limit, 10) : 10;

    /* Fetch paginated projects */
    const { projects, lastEvaluatedKey } = await projectService.getProjects(limitNumber, lastKey);

    logger.info("Projects retrieved successfully", { projects, lastKey: lastEvaluatedKey });
    return SuccessfulAPIResponse.create({ projects, lastKey: lastEvaluatedKey }, "Projects retrieved successfully", StatusCodes.OK);
  } catch (error: any) {
    logger.error("Error retrieving projects", error);
    return ErrorResponse.create(error.message, error, error.statusCode);
  }
};
