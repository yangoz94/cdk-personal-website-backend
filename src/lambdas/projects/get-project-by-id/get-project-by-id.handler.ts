import { StatusCodes } from "http-status-codes";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { ErrorResponse } from "@utils/ErrorResponse.js";
import { LambdaUtils } from "@utils/LambdaUtils.js";
import { logger } from "@utils/Logger.js";
import { SuccessfulAPIResponse } from "@utils/SuccesfulApiResponse.js";
import { ProjectService } from "src/layers/shared/services/ProjectService.js";

const projectService = new ProjectService();

/* Request schema /projects/:{projectId} */
const getProjectByIdSchema = z.object({
  projectId: z.string().uuid(),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    /* Generic lambda request validation */
    const parsedBody = LambdaUtils.validateRequest(event);
    const pathParams = event.pathParameters || {};
    const validationResult = getProjectByIdSchema.safeParse(pathParams);

    if (!validationResult.success) {
      logger.error("Invalid request body: ", validationResult.error.format());
      return ErrorResponse.create("Invalid request body", validationResult.error.format(), StatusCodes.BAD_REQUEST);
    }

    const projectId = validationResult.data.projectId;
    /* Grab the project by ID */
    const project = await projectService.getProjectById(projectId);

    if (!project) {
      return ErrorResponse.create("Project not found", null, StatusCodes.NOT_FOUND);
    }

    return SuccessfulAPIResponse.create(project, `Project with ID ${projectId} retrieved successfully`, StatusCodes.OK);
  } catch (error) {
    logger.error("Error creating project", error);
    return ErrorResponse.create("Error creating project", error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};
