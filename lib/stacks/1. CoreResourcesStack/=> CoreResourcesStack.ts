import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NetworkingConstruct } from "@constructs/NetworkingConstruct";
import { OIDCRoleConstruct } from "@constructs/OIDCRoleConstruct";

export interface CoreResourcesStackProps extends cdk.StackProps {
  appName: string;
  githubRepoName: string;
}

export class CoreResourcesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CoreResourcesStackProps) {
    super(scope, id, props);

    /* Create core resources (OIDC provider, roles, etc.) */
    const oidcAndExecutionRoles = new OIDCRoleConstruct(
      this,
      `${props.appName}-oidc-and-execution-roles-construct`,
      {
        appName: props.appName,
        githubRepoName: props.githubRepoName,
      }
    );

    /* Instantiate the VPC, public and private subnets, internet gateway, and route tables. */
    const networkingResources = new NetworkingConstruct(
      this,
      `${props.appName}-networking-resources-construct`,
      {
        appName: props.appName,
      }
    );
  }
}
