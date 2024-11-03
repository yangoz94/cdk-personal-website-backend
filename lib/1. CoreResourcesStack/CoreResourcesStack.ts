import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { NetworkingConstruct } from "./constructs/NetworkingConstruct";
import { OIDCAndExecutionRolesConstruct } from "./constructs/OIDCAndExecutionRolesConstruct";

export interface CoreResourcesStackProps extends cdk.StackProps {
  appName: string;
  githubRepoName: string;
}

export class CoreResourcesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CoreResourcesStackProps) {
    super(scope, id);

    /* Create core resources (OIDC provider, roles, etc.) */
    const oidcAndExecutionRoles = new OIDCAndExecutionRolesConstruct(
      this,
      `${props.appName}-oidc-and-execution-roles-construct`,
      {
        appName: props.appName,
        githubRepoNameToBeAllowlisted: props.githubRepoName,
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
