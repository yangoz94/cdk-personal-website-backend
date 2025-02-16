import { DDBInstance } from "@ddb/ddb-instance.js";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";

const UserModel = DDBInstance.getModel("User");

const createUserSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  profile_picture_s3_key: z.string(),
  bio: z.string(),
  role: z.string(),
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // 1. Check if request body exists
  if (!event.body) {
    console.error("Request body is missing");
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Request body is missing" }),
    };
  }

  let parsedBody: unknown;
  try {
    // 2. Parse the JSON string into an object
    parsedBody = JSON.parse(event.body);
  } catch (parseError) {
    console.error("Invalid JSON in request body", parseError);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid JSON format in request body" }),
    };
  }

  // 3. Validate data using Zod
  const result = createUserSchema.safeParse(parsedBody);
  if (!result.success) {
    console.error("Validation error", result.error);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Validation  failed",
        errors: result.error.errors,
      }),
    };
  }
  const validatedData = result.data;

  try {
    // 4. Create the user using OneTable
    const dbResult = await UserModel.create(validatedData);
    console.info("User  created successfully", dbResult);
    return {
      statusCode: 201,
      body: JSON.stringify({
        message: "Success - User created successfully!",
        result: dbResult,
      }),
    };
  } catch (dbError) {
    console.error("Error creating user", dbError);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
