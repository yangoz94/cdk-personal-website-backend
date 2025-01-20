import { Entity, schema, string, list } from "dynamodb-toolbox";
import { v4 as uuidv4 } from "uuid";
import MainDynamoDBTable from "./BaseTable";

const projectSchema = schema({
  project_id: string()
    .required()
    .default(() => uuidv4()),
  name: string().required(),
  description: string().required(),
  tags: list(string()).default(() => []),
  tech_stack: list(string()).default(() => []),
  deployed_link: string().required(),
  repository_link: string().required(),
  images_s3_keys: list(string()).required(),
  author: string().required(),
});

const ProjectEntity = new Entity({
  name: "ProjectEntity",
  table: MainDynamoDBTable,
  schema: projectSchema,
  timestamps: {
    created: true,
    modified: true,
  },
  computeKey: (project_id) => ({
    PK: `PROJECT#${project_id}`,
    SK: `METADATA#${project_id}`,
  }),
});

export default ProjectEntity;
