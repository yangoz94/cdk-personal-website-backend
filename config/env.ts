import { z } from "zod";

/** Zod schema for environment variable validation */
const EnvSchema = z.object({
  /** Application name, defaults to an empty string if not set */
  APP_NAME: z.string().default(""),

  /** AWS account ID must be exactly 12 numeric characters */
  AWS_ACCOUNT_ID: z
    .string()
    .regex(/^\d{12}$/, "AWS_ACCOUNT_ID must be exactly 12 numeric characters"),

  /** AWS region, typically 9 characters (e.g., 'us-east-1'), minimum of 5 characters to allow different AWS region formats */
  AWS_REGION: z
    .string()
    .min(5, "AWS_REGION must be at least 5 characters (e.g., 'us-east-1')"),

  /** GitHub repository name in the format "owner/repo" */
  GITHUB_REPO_NAME: z
    .string()
    .min(1, "GITHUB_REPO_NAME must be provided")
    .refine((value) => value.split("/").length === 2, {
      message: "GITHUB_REPO_NAME must be in the format 'user/repo'",
    }),

  /** Optional CDK qualifier, limited to 10 characters for AWS requirements */
  CDK_QUALIFIER: z
    .string()
    .max(10, "CDK_QUALIFIER cannot be longer than 10 characters")
    .default(""),

  /** Optional flag to control core resource deployment, only accepts 'true' or 'false' */
  DEPLOY_CORE_RESOURCES: z.enum(["true", "false"]).optional(),
});

/** Parse and export validated environment variables */
export const env = EnvSchema.parse(process.env);
