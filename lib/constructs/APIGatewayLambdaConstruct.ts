import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import { OutputFormat } from "aws-cdk-lib/aws-lambda-nodejs";
import { Duration } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";

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
   * The entry folder for the Lambda function.
   */
  lambdaFolder: string;

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
   * Whether the route should be protected by an API Gateway authorizer.
   */
  isProtected?: boolean;

  /**
   * Environment variables to set in the Lambda function.
   */
  envVariables?: { [key: string]: string };
}

/**
 * Creates a Lambda function integrated with an API Gateway resource,
 * with optional configuration for VPC, permissions, VPC endpoints, and route protection.
 *
 * @example
 * const apiGatewayLambda = new ApiGatewayLambdaConstruct(this, 'MyLambdaFunction', {
 *   appName: 'myApp',
 *   lambdaName: 'myLambda',
 *   vpc: myVpc,
 *   vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE },
 *   apigw: myApiGateway,
 *   entryFile: 'index.ts',
 *   isProtected: true, // Protect this route
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

    // Create the Lambda function with configurable entry file and settings
    this.lambdaFunction = new nodejs.NodejsFunction(this, props.lambdaName, {
      functionName: `${props.lambdaName}`,
      vpc: props.vpc,
      vpcSubnets: props.vpcSubnets,
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      handler: "handler",
      entry: path.join(
        __dirname,
        `../../src/lambdas/${props.lambdaFolder}/${props.lambdaFolder}.ts`
      ),
      timeout: props.timeout || Duration.seconds(30),
      logRetention: 14,
      environment: props.envVariables || {
        APP_NAME: props.appName,
      },
      bundling: {
        sourceMap: false,
        format: OutputFormat.ESM,
      },
      depsLockFilePath: path.join(
        __dirname,
        `../../src/lambdas/${props.lambdaFolder}/package-lock.json`
      ),
    });

    // Apply additional permissions if specified
    if (props.permissions) {
      this.addPermissions(props.permissions);
    }

    // Configure VPC endpoints if provided
    if (props.vpcEndpoints) {
      this.configureVpcEndpoints(props.vpcEndpoints);
    }

    // Add permission for API Gateway to invoke the Lambda function
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
