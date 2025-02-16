import { Table } from "dynamodb-onetable";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Schema } from "./schema.js";

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
});
const documentClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false },
});

// Create the table instance using the unified schema
const DDBInstance = new Table({
  name: `${process.env.APP_NAME}-table`,
  client: documentClient,
  schema: Schema,
  partial: true,
});
export { DDBInstance };
