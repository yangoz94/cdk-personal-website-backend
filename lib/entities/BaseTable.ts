import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { Table } from "dynamodb-toolbox";

const dynamoDBClient = new DynamoDBClient();

const documentClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

const MainDynamoDBTable = new Table({
  documentClient,
  name: `${process.env.APP_NAME}-table`,
  partitionKey: { name: "PK", type: "string" },
  sortKey: { name: "SK", type: "string" },
});

export default MainDynamoDBTable;
