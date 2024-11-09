import * as apigw from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
import * as targets from "aws-cdk-lib/aws-route53-targets";

/**
 * Properties for configuring the APIGatewayConstruct.
 */
export interface APIGatewayConstructProps extends apigw.RestApiProps {
  /**
   * The name for the API Gateway.
   */
  apiGatewayName: string;

  /**
   * The subdomain for the API Gateway.
   */
  apiSubDomain: string;

  /**
   * The domain name for the API Gateway.
   */
  domain: string;

  /**
   * The hosted zone ID for the domain.
   */
  hostedZoneId: string;
}

/**
 * Creates an Edge-optimized REST API Gateway with custom domain, certificate,
 * access logging, and Route 53 alias record configuration.
 *
 * @example
 * const apiGateway = new APIGatewayConstruct(this, 'MyAPIGateway', {
 *   apiGatewayName: 'my-api-gw',
 *   apiSubDomain: 'api',
 *   domain: 'example.com',
 *   hostedZoneId: 'Z1234567890',
 * });
 */
export class APIGatewayConstruct extends Construct {
  /**
   * The created REST API Gateway resource.
   */
  public readonly restApi: apigw.RestApi;

  /**
   * Constructs a new instance of the APIGatewayConstruct.
   *
   * @param {Construct} scope - The parent construct, typically a CDK stack.
   * @param {string} id - The unique identifier for this construct.
   * @param {APIGatewayConstructProps} props - Properties for configuring the API Gateway.
   */
  constructor(scope: Construct, id: string, props: APIGatewayConstructProps) {
    super(scope, id);

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
        domainName: `*.${props.apiSubDomain}.${props.domain}`,
        subjectAlternativeNames: [`${props.apiSubDomain}.${props.domain}`],
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
        domainName: `${props.apiSubDomain}.${props.domain}`,
        certificate: certificate,
        endpointType: apigw.EndpointType.EDGE,
        securityPolicy: apigw.SecurityPolicy.TLS_1_2,
        mapping: this.restApi,
      }
    );

    /* Add an Alias A Record in Route 53 for the custom domain */
    new route53.ARecord(this, `${props.apiGatewayName}-alias-record`, {
      zone: route53.HostedZone.fromHostedZoneAttributes(
        this,
        `${props.apiGatewayName}-hosted-zone-attributes`,
        {
          hostedZoneId: props.hostedZoneId,
          zoneName: props.domain,
        }
      ),
      recordName: `${props.apiSubDomain}.${props.domain}`,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayDomain(domainName)
      ),
      ttl: Duration.minutes(5),
    });
  }
}
