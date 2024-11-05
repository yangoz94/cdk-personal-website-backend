import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { InfrastructureNestedStack } from "./a.InfrastructureNestedStack";
import { MainAPINestedStack } from "./b.MainAPINestedStack";

export interface PrimaryResourcesStackProps extends cdk.StackProps {
  appName: string;
  apiSubDomain: string;
  apiDomain: string;
  apiVersion: string;
  hostedZoneId: string;
  environment: string;
}

export class PrimaryResourcesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PrimaryResourcesStackProps) {
    super(scope, id, props);

    /* Instantiate Infrastructure Nested Stack */
    const infrastructureStack = new InfrastructureNestedStack(
      this,
      `${props.appName}-infra-stack`,
      {
        appName: props.appName,
      }
    );

    /* Instantiate API Nested Stack AFTER the infrastructure stack */
    const apiStack = new MainAPINestedStack(
      this,
      `${props.appName}-api-stack`,
      {
        appName: props.appName,
        apiSubDomain: props.apiSubDomain,
        apiDomain: props.apiDomain,
        apiVersion: props.apiVersion,
        hostedZoneId: props.hostedZoneId,
        vpc: infrastructureStack.vpc,
        dynamoDBVpcEndpoint: infrastructureStack.dynamoDBVpcEndpoint,
        environment: props.environment,
      }
    );

    /* Add dependency to ensure the infrastructure stack is created first */
    apiStack.addDependency(infrastructureStack);
  }
}
