import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as path from "path";
import { OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Duration } from "aws-cdk-lib";

/**
 * Properties for configuring the ApiGatewayLambdaConstruct.
 */
export interface ApiGatewayLambdaProps {
  /**
   * The application name used as a prefix in resource names.
   */
  appName: string;

  /**
   * The name for the Lambda function.
   */
  lambdaName: string;

  /**
   * The VPC where the Lambda function will be deployed.
   */
  vpc: ec2.IVpc;

  /**
   * The VPC subnets for the Lambda function.
   */
  vpcSubnets: ec2.SubnetSelection;

  /**
   * The REST API where this Lambda function will be integrated.
   */
  restApi: apigw.RestApi;

  /**
   * The resource path for the API Gateway integration.
   */
  resourcePath: string;

  /**
   * The HTTP method (e.g., GET, POST) for the API Gateway resource.
   */
  httpMethod: string;

  /**
   * The API version path.
   */
  apiVersion: string;

  /**
   * The entry file for the Lambda function.
   */
  entryFile: string;

  /**
   * The timeout for the Lambda function (default: 30 seconds).
   */
  timeout?: Duration;

  /**
   * Additional permissions required by the Lambda function (optional).
   */
  permissions?: string[];

  /**
   * VPC endpoints that the Lambda function can access (optional).
   */
  vpcEndpoints?: (ec2.InterfaceVpcEndpoint | ec2.GatewayVpcEndpoint)[];

  /**
   * Node modules to bundle with the Lambda function (optional).
   */
  nodeModules?: string[];

  /**
   * External modules to exclude from bundling in the Lambda function (optional).
   */
  externalModules?: string[];
}

/**
 * Creates a Lambda function integrated with an API Gateway resource,
 * with optional configuration for VPC, permissions, and VPC endpoints.
 *
 * @example
 * const apiGatewayLambda = new ApiGatewayLambdaConstruct(this, 'MyLambdaFunction', {
 *   appName: 'myApp',
 *   lambdaName: 'myLambda',
 *   vpc: myVpc,
 *   vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
 *   restApi: myApi,
 *   resourcePath: '/myresource',
 *   httpMethod: 'GET',
 *   apiVersion: 'v1',
 *   entryFile: 'index.ts',
 * });
 */
export class ApiGatewayLambdaConstruct extends Construct {
  /**
   * The created Lambda function resource.
   */
  public readonly lambdaFunction: lambda.Function;

  /**
   * Constructs a new instance of the ApiGatewayLambdaConstruct.
   *
   * @param {Construct} scope - The parent construct, typically a CDK stack.
   * @param {string} id - The unique identifier for this construct.
   * @param {ApiGatewayLambdaProps} props - Properties for configuring the Lambda function and API Gateway integration.
   */
  constructor(scope: Construct, id: string, props: ApiGatewayLambdaProps) {
    super(scope, id);

    /* Create the Lambda function with configurable entry file */
    this.lambdaFunction = new nodejs.NodejsFunction(this, props.lambdaName, {
      functionName: `${props.lambdaName}`,
      vpc: props.vpc,
      vpcSubnets: props.vpcSubnets,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: "handler",
      entry: path.join(__dirname, `../../src/lambdas/${props.entryFile}`),
      timeout: props.timeout || Duration.seconds(30),
      bundling: {
        sourceMap: false,
        nodeModules: props.nodeModules || [],
        externalModules: props.externalModules || ["@aws-sdk/*", "aws-lambda"],
        format: OutputFormat.ESM,
      },
    });

    /* Set up the API Gateway integration */
    this.addApiGatewayIntegration(props);

    /* Apply additional permissions if specified */
    if (props.permissions) {
      this.addPermissions(props.permissions);
    }

    /* Configure VPC endpoints if provided */
    if (props.vpcEndpoints) {
      this.configureVpcEndpoints(props.vpcEndpoints);
    }
  }

  /**
   * Adds API Gateway integration for the Lambda function.
   *
   * @param {ApiGatewayLambdaProps} props - Properties containing the API resource path and HTTP method.
   */
  private addApiGatewayIntegration(props: ApiGatewayLambdaProps) {
    const fullPath = props.apiVersion
      ? `/${props.apiVersion}${props.resourcePath}`
      : props.resourcePath;
    const pathParts = fullPath.split("/").filter((part) => part !== "");

    let parentResource = props.restApi.root;
    for (const part of pathParts) {
      parentResource =
        parentResource.getResource(part) ?? parentResource.addResource(part);
    }

    parentResource.addMethod(
      props.httpMethod.toUpperCase(),
      new apigw.LambdaIntegration(this.lambdaFunction)
    );

    this.lambdaFunction.addPermission("ApiGatewayInvoke", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
    });
  }

  /**
   * Adds additional permissions to the Lambda function's IAM role.
   *
   * @param {string[]} permissions - A list of actions the Lambda function is allowed to perform.
   */
  private addPermissions(permissions: string[]) {
    this.lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: permissions,
        resources: ["*"],
      })
    );
  }

  /**
   * Configures VPC endpoints for the Lambda function to connect to specified endpoints.
   *
   * @param {(ec2.InterfaceVpcEndpoint | ec2.GatewayVpcEndpoint)[]} vpcEndpoints - Array of VPC endpoints to allow connections.
   */
  private configureVpcEndpoints(
    vpcEndpoints: (ec2.InterfaceVpcEndpoint | ec2.GatewayVpcEndpoint)[]
  ) {
    vpcEndpoints.forEach((endpoint) => {
      if (endpoint instanceof ec2.InterfaceVpcEndpoint) {
        this.lambdaFunction.connections.allowTo(
          endpoint,
          ec2.Port.tcp(443),
          `Allow Lambda to connect to VPC Interface Endpoint ${endpoint.vpcEndpointId}`
        );
      }
    });
  }
}
