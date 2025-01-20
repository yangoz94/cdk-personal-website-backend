import { Entity, schema, string } from "dynamodb-toolbox";
import { v4 as uuidv4 } from "uuid";
import MainDynamoDBTable from "./BaseTable";

const userSchema = schema({
  user_id: string()
    .required()
    .default(() => uuidv4()),
  username: string().required(),
  email: string().required(),
  profile_picture_s3_key: string().required(),
  bio: string().required(),
  role: string().required(),
});

const UserEntity = new Entity({
  name: "UserEntity",
  table: MainDynamoDBTable,
  schema: userSchema,
  timestamps: {
    created: true,
    modified: true,
  },
  computeKey: (user_id) => ({
    PK: `USER#${user_id}`,
    SK: `PROFILE#${user_id}`,
  }),
});

export default UserEntity;
