import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";

export interface InfrastructureNestedStackProps extends cdk.NestedStackProps {
  appName: string;
}

export class InfrastructureNestedStack extends cdk.NestedStack {
  public readonly vpc: ec2.IVpc;
  public readonly dynamoDBTable: dynamodb.TableV2;
  public readonly dynamoDBVpcEndpoint: ec2.GatewayVpcEndpoint;
  public readonly s3VpcEndpoint: ec2.GatewayVpcEndpoint;

  constructor(
    scope: Construct,
    id: string,
    props: InfrastructureNestedStackProps
  ) {
    super(scope, id, props);

    /* VPC Lookup */
    this.vpc = ec2.Vpc.fromLookup(this, `${props.appName}-vpc-lookup`, {
      vpcName: `${props.appName}-vpc`,
    });

    /* Create DynamoDB VPC Endpoint */
    this.dynamoDBVpcEndpoint = this.vpc.addGatewayEndpoint(
      `${props.appName}-dynamodb-vpc-endpoint`,
      {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      }
    );

    /* Instantiate the DynamoDB table */
    this.dynamoDBTable = new dynamodb.TableV2(
      this,
      `${props.appName}-ddb-table`,
      {
        tableName: `${props.appName}-table`,
        partitionKey: { name: "PK", type: AttributeType.STRING },
        sortKey: { name: "SK", type: AttributeType.STRING },
        billing: dynamodb.Billing.onDemand(),
        contributorInsights: false,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
        tableClass: dynamodb.TableClass.STANDARD,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        deletionProtection: false,
        timeToLiveAttribute: "ttl",
      }
    );

    /* Create S3 VPC Endpoint */
    this.s3VpcEndpoint = this.vpc.addGatewayEndpoint(
      `${props.appName}-s3-vpc-endpoint`,
      {
        service: ec2.GatewayVpcEndpointAwsService.S3,
      }
    );
  }
}
