import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log(`Function invoked with event: ${JSON.stringify(event)}`);
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello, World!" }),
  };
};
