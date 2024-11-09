import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as iam from "aws-cdk-lib/aws-iam";

/**
 * Properties for configuring the S3CloudFrontConstruct.
 */
interface S3CloudFrontConstructProps extends cdk.StackProps {
  /**
   * The application name to use as a prefix in resource names.
   */
  appName: string;

  /**
   * The domain name for the CloudFront distribution.
   */
  domainName: string;

  /**
   * The subdomain for the CloudFront distribution.
   */
  cdnSubDomain: string;

  /**
   * The hosted zone ID for the domain.
   */
  hostedZoneId: string;
}

/**
 * Creates an S3 bucket and a CloudFront distribution,
 * and integrates CloudFront with the S3 bucket to make all bucket content publicly accessible (read-only).
 * Adds a Route 53 A record for the CloudFront distribution.
 *
 * @example
 * const s3CloudFront = new S3CloudFrontConstruct(this, 'MyS3CloudFront', {
 *   appName: 'my-personal-website',
 *   domainName: 'example.com',
 *   cdnSubDomain: 'cdn',
 *   hostedZoneId: 'Z1234567890',
 * });
 */
export class S3CloudFrontConstruct extends Construct {
  /**
   * The created S3 bucket resource.
   */
  public readonly bucket: s3.Bucket;

  /**
   * The created CloudFront distribution resource.
   */
  public readonly distribution: cloudfront.Distribution;

  /**
   * The created certificate resource for the CloudFront distribution.
   */
  public readonly certificate: certificatemanager.Certificate;

  /**
   * Constructs a new instance of the S3CloudFrontConstruct.
   *
   * @param {Construct} scope - The parent construct, typically a CDK stack.
   * @param {string} id - The unique identifier for this construct.
   * @param {S3CloudFrontConstructProps} props - Properties for configuring the S3 bucket and CloudFront distribution.
   */
  constructor(scope: Construct, id: string, props: S3CloudFrontConstructProps) {
    super(scope, id);

    /* Lookup the hosted zone for the domain */
    const hostedZone = route53.HostedZone.fromHostedZoneId(
      this,
      `${props.appName}-hosted-zone`,
      props.hostedZoneId
    );

    /* Create an S3 bucket */
    this.bucket = new s3.Bucket(this, `${props.appName}-bucket`, {
      bucketName: `${props.appName}-bucket`,
      publicReadAccess: false, // we will use bucket policy for public access via CDN
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: false,
      versioned: true,
      enforceSSL: true,
      serverAccessLogsPrefix: "logs/",
    });

    /* Grant CloudFront access to the S3 bucket */
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [`${this.bucket.bucketArn}/*`],
        principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")],
        conditions: {
          StringEquals: {
            "AWS:SourceArn": `arn:aws:cloudfront::${cdk.Aws.ACCOUNT_ID}:distribution/${props.appName}-distribution`,
          },
        },
      })
    );

    /* Create a certificate for the CloudFront distribution */
    this.certificate = new certificatemanager.Certificate(
      this,
      `${props.appName}-certificate`,
      {
        certificateName: `${props.appName}-cdn-certificate`,
        domainName: `*.${props.cdnSubDomain}.${props.domainName}`,
        subjectAlternativeNames: [`${props.cdnSubDomain}.${props.domainName}`],
        validation:
          certificatemanager.CertificateValidation.fromDns(hostedZone),
      }
    );

    /* Create a CloudFront distribution */
    this.distribution = new cloudfront.Distribution(
      this,
      `${props.appName}-distribution`,
      {
        domainNames: [`${props.cdnSubDomain}.${props.domainName}`],
        certificate: this.certificate,
        defaultBehavior: {
          origin: new origins.S3Origin(this.bucket),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          responseHeadersPolicy:
            cloudfront.ResponseHeadersPolicy.SECURITY_HEADERS,
        },
      }
    );

    /* Create an Alias A Record in Route 53 for the CloudFront distribution */
    new route53.ARecord(this, `${props.appName}-alias-record`, {
      zone: route53.HostedZone.fromHostedZoneAttributes(
        this,
        `${props.appName}-hosted-zone-attributes`,
        {
          hostedZoneId: props.hostedZoneId,
          zoneName: props.domainName,
        }
      ),
      recordName: `${props.cdnSubDomain}.${props.domainName}`,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(this.distribution)
      ),
    });

    /* Store the CloudFront distribution URL in SSM Parameter Store */
    new ssm.StringParameter(this, `${props.appName}-distribution-url-param`, {
      parameterName: `/${props.appName}/cdn/url`,
      stringValue: this.distribution.distributionDomainName,
      description: `The CloudFront distribution URL for ${props.appName}`,
    });
  }
}
