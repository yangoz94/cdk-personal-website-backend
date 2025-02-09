import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import {
  APIGatewayWithCognitoUserPoolConstruct,
  CognitoConfig,
} from "../../constructs/APIGatewayWithCognitoUserPoolConstruct";
import { SynchronousLambdaConstruct } from "../../constructs/SynchronousLambdaConstruct";
import { S3CloudFrontConstruct } from "../../constructs/S3CloudfrontConstruct";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import path = require("path");

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
  dynamoDBTable: TableV2;
}

export interface APIRouteDefinition {
  route: string;
  method: APIMethodsEnum;
  lambdaFunction: SynchronousLambdaConstruct;
  isProtected: boolean;
}

export enum APIMethodsEnum {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

export class MainAPINestedStack extends cdk.NestedStack {
  public readonly apiGateway: APIGatewayWithCognitoUserPoolConstruct;
  public readonly s3BucketWithCDN: S3CloudFrontConstruct;
  public readonly helloFunction: SynchronousLambdaConstruct;
  public readonly allRoutes: APIRouteDefinition[] = [];

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
    this.helloFunction = new SynchronousLambdaConstruct(
      this,
      `${props.appName}-hello-function-x`,
      {
        appName: props.appName,
        lambdaName: `${props.appName}-hello-x`,
        vpc: props.vpc,
        vpcSubnets: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }),
        permissions: ["dynamodb:Query", "dynamodb:GetItem", "dynamodb:PutItem"],
        nodeModules: ["uuid", "dynamodb-toolbox", "zod"],
        externalModules: ["@aws-sdk/*", "aws-lambda"],
        vpcEndpoints: [props.dynamoDBVpcEndpoint],
        entry: path.join(__dirname, "../../../src/lambdas/hello/hello.ts"),
        envVariables: {
          APP_NAME: props.appName,
          DYNAMODB_TABLE_NAME: props.dynamoDBTable.tableName,
        },
      }
    );

    this.allRoutes = [
      {
        route: `/${props.apiVersion}/hello`,
        method: APIMethodsEnum.POST,
        lambdaFunction: this.helloFunction,
        isProtected: false,
      },
      {
        route: `/${props.apiVersion}/hello2`,
        method: APIMethodsEnum.POST,
        lambdaFunction: this.helloFunction,
        isProtected: true,
      },
    ];

    this.allRoutes.forEach((route) => {
      this.apiGateway.addMethod(
        route.route,
        route.method,
        route.lambdaFunction.lambdaFunction,
        route.isProtected
      );
    });
  }
}
