import { Entity, schema, string, list } from "dynamodb-toolbox";
import { v4 as uuidv4 } from "uuid";
import MainDynamoDBTable from "./BaseTable";

const blogSchema = schema({
  blog_id: string()
    .required()
    .default(() => uuidv4()),
  title: string().required(),
  description: string().required(),
  tags: list(string()).default(() => []),
  category: string().required(),
  subcategory: string().required(),
  content_s3_key: string().required(),
  author: string().required(),
});

const BlogEntity = new Entity({
  name: "BlogEntity",
  table: MainDynamoDBTable,
  schema: blogSchema,
  timestamps: {
    created: true,
    modified: true,
  },
  computeKey: (blog_id) => ({
    PK: `BLOG#${blog_id}`,
    SK: `METADATA#${blog_id}`,
  }),
});

export default BlogEntity;
