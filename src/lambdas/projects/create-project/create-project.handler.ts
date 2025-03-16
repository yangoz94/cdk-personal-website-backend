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

const nameRegex = /^[a-z0-9 ,.'-]+$/i;

export const createProjectSchema = z.object({
  name: z.string({ required_error: "Name is required" }).regex(nameRegex, "Name format is invalid"),
  description: z.string({ required_error: "Description is required" }),
  tags: z.array(z.string({ required_error: "Each tag must be a string" })).optional(),
  tech_stack: z.array(z.string({ required_error: "Each tech stack item must be a string" })).optional(),
  live_url: z.string().optional(),
  github_url: z.string({ required_error: "Repository link is required" }),
  images_s3_keys: z.array(z.string(), { required_error: "Images S3 keys are required" }).min(1, "At least one image key is required"),
});

export type createProjectType = z.infer<typeof createProjectSchema>;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    /* Generic lambda request validation */
    const parsedBody = LambdaUtils.validateRequest(event);
    const validationResult = createProjectSchema.safeParse(parsedBody);

    if (!validationResult.success) {
      logger.error("Invalid request body", validationResult.error.format());
      return ErrorResponse.create("Invalid request body", validationResult.error.format(), StatusCodes.BAD_REQUEST);
    }

    /* Create new project by calling the Service layer */
    const newProject = await projectService.createProject(validationResult.data);

    return SuccessfulAPIResponse.create(newProject, "Project created successfully", StatusCodes.CREATED);
  } catch (error) {
    logger.error("Error creating project", error);
    return ErrorResponse.create("Error creating project", error, StatusCodes.INTERNAL_SERVER_ERROR);
  }
};
