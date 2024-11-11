import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { InfrastructureNestedStack } from "./a.InfrastructureNestedStack";
import { MainAPINestedStack } from "./b.MainAPINestedStack";
import { CognitoConfig } from "../../constructs/APIGatewayWithCognitoUserPoolConstruct";

export interface PrimaryResourcesStackProps extends cdk.StackProps {
  appName: string;
  apiSubDomain: string;
  authSubdomain: string;
  domain: string;
  apiVersion: string;
  hostedZoneId: string;
  cdnSubDomain: string;
  cognitoConfig: CognitoConfig;
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
        domain: props.domain,
        authSubdomain: props.authSubdomain,
        apiVersion: props.apiVersion,
        cdnSubDomain: props.cdnSubDomain,
        hostedZoneId: props.hostedZoneId,
        vpc: infrastructureStack.vpc,
        dynamoDBVpcEndpoint: infrastructureStack.dynamoDBVpcEndpoint,
        cognitoConfig: props.cognitoConfig,
        dynamoDBTable: infrastructureStack.dynamoDBTable,
      }
    );

    /* Add dependency to ensure the infrastructure stack is created first */
    apiStack.addDependency(infrastructureStack);
  }
}
