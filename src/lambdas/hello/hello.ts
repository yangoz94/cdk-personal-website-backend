import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { z } from "zod";

// Define a Zod schema for the expected shape of event.body
const requestBodySchema = z.object({
  name: z.string(),
  age: z.number().optional(),
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(
    `Function innvoked with the following: ${JSON.stringify(event)}`
  );

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid JSON format in request body." }),
    };
  }

  // Validate the parsed body with Zod schema
  const parseResult = requestBodySchema.safeParse(body);
  if (!parseResult.success) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "Validation failed - check errors for more details.",
        errors: parseResult.error.errors,
      }),
    };
  }

  // Use the validated data if needed
  const { name, age } = parseResult.data;

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, ${name}!`,
      ...(age ? { age } : {}),
    }),
  };
};
