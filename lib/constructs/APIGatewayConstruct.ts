import * as apigw from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import * as targets from "aws-cdk-lib/aws-route53-targets";

export interface APIGatewayConstructProps extends apigw.RestApiProps {
  apiGatewayName: string;
  apiSubDomain: string;
  apiDomain: string;
  hostedZoneId: string;
}

export class APIGatewayConstruct extends Construct {
  public readonly restApi: apigw.RestApi;

  constructor(scope: Construct, props: APIGatewayConstructProps) {
    super(scope, props.apiGatewayName);

    /* Create an access log group for the API Gateway */
    const accessLogGroup = new logs.LogGroup(
      this,
      `${props.apiGatewayName}-access-logs`,
      {
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    /* Create the API Gateway */
    this.restApi = new apigw.RestApi(this, props.apiGatewayName, {
      /* Pass basic configuration options for API Gateway */
      restApiName: props.apiGatewayName,
      endpointConfiguration: {
        types: [apigw.EndpointType.EDGE],
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowMethods: apigw.Cors.ALL_METHODS,
        allowHeaders: [
          "Content-Type",
          "X-Amz-Date",
          "Authorization",
          "X-Api-Key",
          "X-Amz-Security-Token",
        ],
      },
      deployOptions: {
        loggingLevel: apigw.MethodLoggingLevel.INFO,
        accessLogDestination: new apigw.LogGroupLogDestination(accessLogGroup),
        dataTraceEnabled: true,
        metricsEnabled: true,
      },
      cloudWatchRole: true,
      cloudWatchRoleRemovalPolicy: RemovalPolicy.DESTROY,
    });

    /* Lookup the hosted zone for the domain */
    const hostedZone = route53.HostedZone.fromHostedZoneId(
      this,
      `${props.apiGatewayName}-hosted-zone`,
      props.hostedZoneId
    );

    /* Create the HTTPS wildcard certificate for the API Gateway */
    const certificate = new certificatemanager.Certificate(
      this,
      `${props.apiGatewayName}-certificate`,
      {
        domainName: `*.${props.apiSubDomain}.${props.apiDomain}`,
        subjectAlternativeNames: [`${props.apiSubDomain}.${props.apiDomain}`],
        certificateName: `${props.apiGatewayName}-certificate`,
        validation:
          certificatemanager.CertificateValidation.fromDns(hostedZone),
      }
    );

    /* Create the custom domain name for the API Gateway */
    const domainName = new apigw.DomainName(
      this,
      `${props.apiGatewayName}-domain`,
      {
        domainName: `${props.apiSubDomain}.${props.apiDomain}`,
        certificate: certificate,
        endpointType: apigw.EndpointType.EDGE,
        securityPolicy: apigw.SecurityPolicy.TLS_1_2,
        mapping: this.restApi,
      }
    );

    /* Add an Alias A Record in Route 53 for the custom domain */
    new route53.ARecord(this, `${props.apiGatewayName}-alias-record`, {
      /* ID based Hosted zone lookup doesnt support zoneName extraction */
      zone: route53.HostedZone.fromHostedZoneAttributes(
        this,
        `${props.apiGatewayName}-hosted-zone-attributes`,
        {
          hostedZoneId: props.hostedZoneId,
          zoneName: props.apiDomain,
        }
      ),
      recordName: `${props.apiSubDomain}.${props.apiDomain}`,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayDomain(domainName)
      ),
      ttl: Duration.minutes(5),
    });
  }
}
