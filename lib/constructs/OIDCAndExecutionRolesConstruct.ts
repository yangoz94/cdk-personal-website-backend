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
 * new ExecutionRolesConstruct(this, 'ExecutionRoles', {
 *   githubRepoNameToBeAllowlisted: 'my-org/my-repo',
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

    /* Grab the region from the stack environment */
    const region = cdk.Stack.of(this).account;

    /* Create the OIDC provider for GitHub Actions */
    const oidcProvider = new iam.OpenIdConnectProvider(this, `oidc-provider`, {
      url: "https://token.actions.githubusercontent.com",
      clientIds: ["sts.amazonaws.com"],
      thumbprints: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
    });

    /* GitHub Actions OIDC Role with permission to assume the execution role */
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

    const oidcPolicyStatement = new iam.PolicyStatement({
      actions: ["sts:AssumeRole"],
      resources: [
        `arn:aws:iam::${region}:role/${props.appName}-cfn-execution-role`,
      ],
      sid: `CFNExecutionRoleAssumeRole`,
    });

    /* Create a policy for OIDC */
    const oidcPolicy = new iam.Policy(this, `${props.appName}-oidc-policy`, {
      policyName: `${props.appName}-oidc-policy`,
      statements: [oidcPolicyStatement],
    });

    /* Attach OIDC policy to the GitHub OIDC role */
    oidcPolicy.attachToRole(githubOidcRole);

    /* CloudFormation execution role for managing AWS resources */
    const executionRole = new iam.Role(
      this,
      `${props.appName}-execution-role`,
      {
        assumedBy: new iam.ServicePrincipal("cloudformation.amazonaws.com"),
        roleName: `${props.appName}-cfn-execution-role`,
      }
    );

    /* Attach necessary permissions to the CloudFormation execution role */
    executionRole.addToPolicy(
      new iam.PolicyStatement({
        actions: EXECUTION_ROLE_ACTIONS,
        resources: ["*"],
      })
    );
  }
}
