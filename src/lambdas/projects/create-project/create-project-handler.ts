import { DDBInstance } from "@ddb/ddb-instance.js";
import { LambdaUtils } from "@utils/LambdaUtils.js";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";
import { SuccessfulAPIResponse } from "@utils/SuccesfulApiResponse.js";
import { ErrorResponse } from "@utils/ErrorResponse.js";
import { logger } from "@utils/Logger.js";
import { StatusCodes } from "http-status-codes";
import { ProjectService } from "src/layers/shared/services/ProjectService.js";

const projectService = new ProjectService();

const createProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  tags: z.array(z.string()).optional(),
  tech_stack: z.array(z.string()).optional(),
  deployed_link: z.string().optional(),
  repository_link: z.string(),
  images_s3_keys: z.array(z.string()),
});

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    /* Generic lambda request validation */
    const parsedBody = LambdaUtils.validateRequest(event);
    const validationResult = createProjectSchema.safeParse(parsedBody);

    if (!validationResult.success) {
      logger.error("Invalid request body", validationResult.error.format());
      return ErrorResponse.create("Invalid request body", validationResult.error.format());
    }

    /* Create new project by calling the Service layer */
    const newProject = await projectService.createProject(validationResult.data);

    return SuccessfulAPIResponse.create(newProject, "Project created successfully", StatusCodes.CREATED);
  } catch (error) {
    logger.error("Error creating project", error);
    return ErrorResponse.create("Error creating project", error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};
