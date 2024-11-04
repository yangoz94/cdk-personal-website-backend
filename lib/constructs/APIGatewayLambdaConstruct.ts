import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";

export interface ApiGatewayLambdaProps {
  appName: string;
  lambdaName: string;
  vpc: ec2.IVpc;
  vpcSubnets: ec2.SubnetSelection;
  restApi: apigw.RestApi;
  resourcePath: string;
  httpMethod: string;
  apiVersion?: string;
  entryFile: string; // New property to specify the Lambda file name
  permissions?: string[];
  vpcEndpoints?: (ec2.InterfaceVpcEndpoint | ec2.GatewayVpcEndpoint)[];
  nodeModules?: string[];
  externalModules?: string[];
}

export class ApiGatewayLambdaConstruct extends Construct {
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: ApiGatewayLambdaProps) {
    super(scope, id);

    // Create the Lambda function with configurable entry file
    this.lambdaFunction = new nodejs.NodejsFunction(this, props.lambdaName, {
      functionName: `${props.lambdaName}`,
      vpc: props.vpc,
      vpcSubnets: props.vpcSubnets,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: "handler",
      entry: path.join(__dirname, `../../../src/lambdas/${props.entryFile}`), // Use entryFile here
      bundling: {
        sourceMap: false,
        nodeModules: props.nodeModules || [],
        externalModules: props.externalModules || ["@aws-sdk/*", "aws-lambda"],
        format: OutputFormat.ESM,
      },
    });

    // Set up the API Gateway integration
    this.addApiGatewayIntegration(props);

    // Apply additional permissions if specified
    if (props.permissions) {
      this.addPermissions(props.permissions);
    }

    // Configure VPC endpoints if provided
    if (props.vpcEndpoints) {
      this.configureVpcEndpoints(props.vpcEndpoints);
    }
  }

  private addApiGatewayIntegration(props: ApiGatewayLambdaProps) {
    // Construct the full path for the API
    const fullPath = props.apiVersion
      ? `/${props.apiVersion}${props.resourcePath}`
      : props.resourcePath;
    const pathParts = fullPath.split("/").filter((part) => part !== "");

    // Traverse and create the resource path
    let parentResource = props.restApi.root;
    for (const part of pathParts) {
      parentResource =
        parentResource.getResource(part) ?? parentResource.addResource(part);
    }

    // Add the HTTP method to the API Gateway resource
    parentResource.addMethod(
      props.httpMethod.toUpperCase(),
      new apigw.LambdaIntegration(this.lambdaFunction)
    );

    // Automatically add permission for API Gateway to invoke this Lambda function
    this.lambdaFunction.addPermission("ApiGatewayInvoke", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });
  }

  private addPermissions(permissions: string[]) {
    this.lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: permissions,
        resources: ["*"],
      })
    );
  }

  // Configure VPC Endpoints for the Lambda function
  private configureVpcEndpoints(
    vpcEndpoints: (ec2.InterfaceVpcEndpoint | ec2.GatewayVpcEndpoint)[]
  ) {
    vpcEndpoints.forEach((endpoint) => {
      if (endpoint instanceof ec2.InterfaceVpcEndpoint) {
        // Allow Lambda to connect to Interface VPC Endpoint
        this.lambdaFunction.connections.allowTo(
          endpoint,
          ec2.Port.tcp(443),
          `Allow Lambda to connect to VPC Interface Endpoint ${endpoint.vpcEndpointId}`
        );
      }
      // No configuration needed for GatewayVpcEndpoint as route tables are automatically updated
    });
  }
}
