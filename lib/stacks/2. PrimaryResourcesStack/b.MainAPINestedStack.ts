import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {
  APIGatewayWithCognitoUserPoolConstruct,
  CognitoConfig,
} from "../../constructs/APIGatewayWithCognitoUserPoolConstruct";
import { ApiGatewayLambdaConstruct } from "../../constructs/APIGatewayLambdaConstruct";
import { S3CloudFrontConstruct } from "../../constructs/S3CloudfrontConstruct";

export interface MainAPINestedStackProps extends cdk.NestedStackProps {
  appName: string;
  domain: string;
  apiSubDomain: string;
  authSubdomain: string;
  apiVersion: string;
  cdnSubDomain: string;
  hostedZoneId: string;
  vpc: ec2.IVpc;
  dynamoDBVpcEndpoint: ec2.GatewayVpcEndpoint;
  cognitoConfig: CognitoConfig;
}

export class MainAPINestedStack extends cdk.NestedStack {
  public readonly apiGateway: APIGatewayWithCognitoUserPoolConstruct;
  public readonly s3BucketWithCDN: S3CloudFrontConstruct;
  public readonly helloFunction: ApiGatewayLambdaConstruct;

  constructor(scope: Construct, id: string, props: MainAPINestedStackProps) {
    super(scope, id, props);

    /* Instantiate Edge-optimized API Gateway with Cognito authentication */
    this.apiGateway = new APIGatewayWithCognitoUserPoolConstruct(
      this,
      `${props.appName}-api-gateway`,
      {
        appName: props.appName,
        apiSubDomain: props.apiSubDomain,
        authSubdomain: props.authSubdomain,
        domain: props.domain,
        hostedZoneId: props.hostedZoneId,
        cognitoConfig: props.cognitoConfig,
      }
    );

    /* Instantiate S3 bucket with CloudFront distribution */
    this.s3BucketWithCDN = new S3CloudFrontConstruct(
      this,
      `${props.appName}-s3-cloudfront`,
      {
        appName: props.appName,
        domainName: props.domain,
        cdnSubDomain: props.cdnSubDomain,
        hostedZoneId: props.hostedZoneId,
      }
    );

    /* Instantiate Hello Lambda function */
    this.helloFunction = new ApiGatewayLambdaConstruct(
      this,
      `${props.appName}-hello-function`,
      {
        appName: props.appName,
        lambdaName: `${props.appName}-hello`,
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }),
        permissions: ["dynamodb:Query", "dynamodb:GetItem"],
        vpcEndpoints: [props.dynamoDBVpcEndpoint],
        entryFile: "hello.ts",
      }
    );

    /* add route to API Gateway */
    this.apiGateway.addMethod(
      `/${props.apiVersion}/hello`,
      "GET",
      this.helloFunction.lambdaFunction,
      false
    );
    this.apiGateway.addMethod(
      `/${props.apiVersion}/hello2`,
      "GET",
      this.helloFunction.lambdaFunction,
      true
    );
  }
}
