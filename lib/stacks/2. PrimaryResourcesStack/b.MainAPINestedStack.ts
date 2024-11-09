import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { APIGatewayConstruct } from "../../constructs/APIGatewayConstruct";
import { ApiGatewayLambdaConstruct } from "../../constructs/APIGatewayLambdaConstruct";
import { S3CloudFrontConstruct } from "../../constructs/S3CloudfrontConstruct";

export interface MainAPINestedStackProps extends cdk.NestedStackProps {
  appName: string;
  domain: string;
  apiSubDomain: string;
  apiVersion: string;
  cdnSubDomain: string;
  hostedZoneId: string;
  vpc: ec2.IVpc;
  dynamoDBVpcEndpoint: ec2.GatewayVpcEndpoint;
}

export class MainAPINestedStack extends cdk.NestedStack {
  public readonly apiGateway: APIGatewayConstruct;
  public readonly s3BucketWithCDN: S3CloudFrontConstruct;
  public readonly helloFunction: ApiGatewayLambdaConstruct;

  constructor(scope: Construct, id: string, props: MainAPINestedStackProps) {
    super(scope, id, props);

    /* Instantiate the APIGateway Edge-optimized REST API */
    this.apiGateway = new APIGatewayConstruct(
      this,
      `${props.appName}-api-gateway`,
      {
        apiGatewayName: `${props.appName}-api-gateway`,
        apiSubDomain: props.apiSubDomain,
        domain: props.domain,
        hostedZoneId: props.hostedZoneId,
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
        restApi: this.apiGateway.restApi,
        apiVersion: props.apiVersion,
        resourcePath: "/hello",
        httpMethod: "GET",
        permissions: ["dynamodb:Query", "dynamodb:GetItem"],
        vpcEndpoints: [props.dynamoDBVpcEndpoint],
        entryFile: "hello.ts",
      }
    );
  }
}
