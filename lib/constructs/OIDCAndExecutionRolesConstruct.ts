import * as cdk from "aws-cdk-lib";
import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";

interface OIDCAndExecutionRolesConstructProps extends StackProps {
  /** GitHub repository to allow for OIDC, formatted as "user/repo" or "org/repo". */
  githubRepoName: string;

  /** Application name to use as a prefix in resource names. */
  appName: string;
}

/**
 * Permissions required for the CloudFormation execution role to manage AWS resources.
 */
const EXECUTION_ROLE_ACTIONS = [
  "apigateway:*",
  "lambda:*",
  "ecs:*",
  "ec2:*",
  "s3:*",
  "dynamodb:*",
  "sqs:*",
  "sns:*",
];

/**
 * Creates an OIDC provider, GitHub OIDC role, and CloudFormation
 * execution role with specified permissions, allowing GitHub Actions to assume the execution role to deploy AWS resources.
 *
 * @example
 * new OIDCAndExecutionRolesConstruct(this, 'OIDCAndExecutionRoles', {
 *   githubRepoName: 'my-org/my-repo',
 *   appName: 'my-app',
 *   env: { account: '123456789012', region: 'us-east-1' },
 * });
 */
export class OIDCAndExecutionRolesConstruct extends Construct {
  /**
   * Creates roles and permissions for GitHub Actions OIDC and CloudFormation execution.
   *
   * @param {Construct} scope - The parent construct, typically a CDK stack.
   * @param {string} id - The unique identifier for this construct.
   * @param {OIDCAndExecutionRolesConstructProps} props - Properties for configuring the construct.
   */
  constructor(
    scope: Construct,
    id: string,
    props: OIDCAndExecutionRolesConstructProps
  ) {
    super(scope, id);

    /* Set up the GitHub OIDC provider */
    const oidcProvider = new iam.OpenIdConnectProvider(this, `oidc-provider`, {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
      thumbprints: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
    });

    /**
     * GitHub Actions OIDC Role: Allows GitHub Actions in the specified repository
     * to assume the CloudFormation execution role.
     */
    const githubOidcRole = new iam.Role(
      this,
      `${props.appName}-github-oidc-role`,
      {
        assumedBy: new iam.WebIdentityPrincipal(
          oidcProvider.openIdConnectProviderArn,
          {
            StringLike: {
              "token.actions.githubusercontent.com:sub": `repo:${props.githubRepoName}:*`,
            },
          }
        ),
        description: `${props.appName} GitHub Actions OIDC Role`,
        roleName: `${props.appName}-github-oidc-role`,
      }
    );

    /**
     * Policy to allow the OIDC role to assume the execution role.
     */
    githubOidcRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ["sts:AssumeRole"],
        resources: [
          `arn:aws:iam::${cdk.Stack.of(this).account}:role/${
            props.appName
          }-cfn-execution-role`,
        ],
        sid: "AllowAssumeCfnExecutionRole",
      })
    );

    // /* Additional policies for OIDC Role */
    // new iam.Policy(this, `${props.appName}-oidc-policy`, {
    //   policyName: `${props.appName}-oidc-policy`,
    //   statements: [
    //     new iam.PolicyStatement({
    //       sid: "AllowCDKDeployments",
    //       actions: ["sts:AssumeRole"],
    //       resources: [
    //         `arn:aws:iam::${cdk.Stack.of(this).account}:role/cdk-${
    //           props.appName
    //         }-*`,
    //       ],
    //     }),
    //     new iam.PolicyStatement({
    //       sid: "CloudFormationActions",
    //       actions: ["cloudformation:*"],
    //       resources: ["*"],
    //     }),

    //     new iam.PolicyStatement({
    //       sid: "S3BucketActions",
    //       actions: ["s3:*"],
    //       resources: [`arn:aws:s3:::${props.appName}-*`],
    //     }),

    //     new iam.PolicyStatement({
    //       sid: "SSMGet",
    //       actions: ["ssm:GetParameter"],
    //       resources: [
    //         `arn:aws:ssm:${cdk.Stack.of(this).region}:${
    //           cdk.Stack.of(this).account
    //         }:parameter/cdk-bootstrap/${props.appName}/version`,
    //       ],
    //     }),

    //     new iam.PolicyStatement({
    //       sid: "ReadEventSchemaRegistry",
    //       actions: [
    //         "schemas:DescribeRegistry",
    //         "schemas:ListSchemas",
    //         "schemas:SearchSchemas",
    //         "schemas:DescribeSchema",
    //         "schemas:ListSchemaVersions",
    //         "schemas:DescribeCodeBinding",
    //         "schemas:GetCodeBindingSource",
    //       ],
    //       resources: [
    //         `arn:aws:schemas:${cdk.Stack.of(this).region}:${
    //           cdk.Stack.of(this).account
    //         }:registry/*`,
    //         `arn:aws:schemas:${cdk.Stack.of(this).region}:${
    //           cdk.Stack.of(this).account
    //         }:schema/*`,
    //       ],
    //     }),
    //   ],
    // }).attachToRole(githubOidcRole);

    /**
     * CloudFormation Execution Role: This role allows CloudFormation
     * to manage AWS resources as specified in the `EXECUTION_ROLE_ACTIONS`.
     */
    const executionRole = new iam.Role(
      this,
      `${props.appName}-execution-role`,
      {
        assumedBy: new iam.ServicePrincipal("cloudformation.amazonaws.com"),
        roleName: `${props.appName}-cfn-execution-role`,
        description: `${props.appName} CloudFormation Execution Role`,
      }
    );

    /**
     * Execution Policy: Allows CloudFormation to manage specified AWS resources.
     */
    const executionPolicy = new iam.Policy(
      this,
      `${props.appName}-cfn-execution-policy`,
      {
        policyName: `${props.appName}-execution-policy`,
        statements: [
          new iam.PolicyStatement({
            actions: EXECUTION_ROLE_ACTIONS,
            resources: ["*"],
            sid: "ResourceManagementPolicy",
          }),
        ],
      }
    );

    /* Attach permissions to the CloudFormation execution role */
    executionPolicy.attachToRole(executionRole);
  }
}
