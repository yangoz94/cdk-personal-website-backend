import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { APIGatewayWithCognitoUserPoolConstruct, CognitoConfig } from "@constructs/APIGatewayWithCognitoUserPoolConstruct";
import { APIMethodsEnum, DynamoDBPermissions, LambdaConstruct } from "@constructs/LambdaConstruct";
import { S3CloudFrontConstruct } from "@constructs/S3CloudfrontConstruct";
import { TableV2 } from "aws-cdk-lib/aws-dynamodb";
import * as path from "path";
import { CommonLayerConstruct } from "@constructs/CommonLayerConstruct";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";

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

export class MainAPINestedStack extends cdk.NestedStack {
  public readonly apiGateway: APIGatewayWithCognitoUserPoolConstruct;
  public readonly s3BucketWithCDN: S3CloudFrontConstruct;
  public readonly commonLayer: LayerVersion;

  public readonly createProjectLambda: LambdaConstruct;
  public readonly getProjectByIdLambda: LambdaConstruct;
  public readonly getProjectsLambda: LambdaConstruct;

  constructor(scope: Construct, id: string, props: MainAPINestedStackProps) {
    super(scope, id, props);

    /* Instantiate Edge-optimized API Gateway with Cognito authentication */
    this.apiGateway = new APIGatewayWithCognitoUserPoolConstruct(this, `${props.appName}-api-gateway`, {
      appName: props.appName,
      apiSubDomain: props.apiSubDomain,
      authSubdomain: props.authSubdomain,
      domain: props.domain,
      hostedZoneId: props.hostedZoneId,
      cognitoConfig: props.cognitoConfig,
    });

    /* Instantiate S3 bucket with CloudFront distribution */
    this.s3BucketWithCDN = new S3CloudFrontConstruct(this, `${props.appName}-s3-cloudfront`, {
      appName: props.appName,
      domainName: props.domain,
      cdnSubDomain: props.cdnSubDomain,
      hostedZoneId: props.hostedZoneId,
    });

    /* Create Shared Layer */
    this.commonLayer = new CommonLayerConstruct(this, `${props.appName}-common-layer`, {
      layerName: `${props.appName}-common-layer`,
    }).layer;

    /* Instantiate Create Project Lambda */
    this.createProjectLambda = new LambdaConstruct(this, `${props.appName}-create-project-lambda`, {
      appName: props.appName,
      lambdaName: `${props.appName}-create-project`,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      }),
      permissions: [DynamoDBPermissions.PUT_ITEM],
      layers: [this.commonLayer],
      nodeModules: [],
      externalModules: ["@aws-sdk/*", "aws-lambda"],
      vpcEndpoints: [props.dynamoDBVpcEndpoint],
      entry: path.join(__dirname, "../../../src/lambdas/projects/create-project/create-project.handler.ts"),
      envVariables: {
        APP_NAME: props.appName,
        DDB_TABLE_NAME: props.dynamoDBTable.tableName,
      },
      apiGwIntegration: {
        apiGateway: this.apiGateway,
        route: `/${props.apiVersion}/projects/create`,
        method: APIMethodsEnum.POST,
        isProtected: true,
      },
    });

    /* Instantiate Get Project by ID Lambda */
    this.getProjectByIdLambda = new LambdaConstruct(this, `${props.appName}-get-project-by-id-lambda`, {
      appName: props.appName,
      lambdaName: `${props.appName}-get-project-by-id`,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      }),
      permissions: [DynamoDBPermissions.GET_ITEM],
      layers: [this.commonLayer],
      nodeModules: [],
      externalModules: ["@aws-sdk/*", "aws-lambda"],
      vpcEndpoints: [props.dynamoDBVpcEndpoint],
      entry: path.join(__dirname, "../../../src/lambdas/projects/get-project-by-id/get-project-by-id.handler.ts"),
      envVariables: {
        APP_NAME: props.appName,
        DDB_TABLE_NAME: props.dynamoDBTable.tableName,
      },
      apiGwIntegration: {
        apiGateway: this.apiGateway,
        route: `/${props.apiVersion}/projects/{projectId}`,
        method: APIMethodsEnum.GET,
        isProtected: false,
      },
    });

    /* Instantiate Get Projects Lambda */
    this.getProjectsLambda = new LambdaConstruct(this, `${props.appName}-get-projects-lambda`, {
      appName: props.appName,
      lambdaName: `${props.appName}-get-projects`,
      vpc: props.vpc,
      vpcSubnets: props.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      }),
      permissions: [DynamoDBPermissions.QUERY],
      layers: [this.commonLayer],
      nodeModules: [],
      externalModules: ["@aws-sdk/*", "aws-lambda"],
      vpcEndpoints: [props.dynamoDBVpcEndpoint],
      entry: path.join(__dirname, "../../../src/lambdas/projects/get-projects/get-projects.handler.ts"),
      envVariables: {
        APP_NAME: props.appName,
        DDB_TABLE_NAME: props.dynamoDBTable.tableName,
      },
      apiGwIntegration: {
        apiGateway: this.apiGateway,
        route: `/${props.apiVersion}/projects`,
        method: APIMethodsEnum.GET,
        isProtected: false,
      },
    });
  }
}
