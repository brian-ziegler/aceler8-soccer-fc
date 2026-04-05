import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface Aceler8SiteStackProps extends cdk.StackProps {
  readonly bucketName: string;
  readonly siteDomain: string;
  readonly githubOwner?: string;
  readonly githubRepository?: string;
  readonly acmCertificateArn?: string;
  /** Create IAM OIDC provider for GitHub (false if account already has one). */
  readonly createGithubOidcProvider?: boolean;
  /** Required when createGithubOidcProvider is false. */
  readonly existingGithubOidcProviderArn?: string;
}

function truncateRoleName(name: string, max = 64): string {
  return name.length <= max ? name : name.slice(0, max);
}

export class Aceler8SiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Aceler8SiteStackProps) {
    super(scope, id, props);

    const {
      bucketName,
      siteDomain,
      githubOwner,
      githubRepository,
      acmCertificateArn,
      createGithubOidcProvider = true,
      existingGithubOidcProviderArn,
    } = props;

    const useCustomCert = !!acmCertificateArn && acmCertificateArn.length > 0;

    const bucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const oacName = `${bucketName.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 40)}-oac`;
    const oac = new cloudfront.S3OriginAccessControl(this, 'SiteOAC', {
      signing: cloudfront.Signing.SIGV4_ALWAYS,
      originAccessControlName: oacName,
    });

    const s3Origin = origins.S3BucketOrigin.withOriginAccessControl(bucket, {
      originAccessControl: oac,
    });

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      comment: siteDomain,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: s3Origin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      domainNames: useCustomCert ? [siteDomain] : undefined,
      certificate: useCustomCert
        ? acm.Certificate.fromCertificateArn(this, 'AcmCert', acmCertificateArn!)
        : undefined,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    const oidcReady = !!(githubOwner && githubRepository);
    let githubOidcArn: string | undefined;

    if (existingGithubOidcProviderArn) {
      githubOidcArn = existingGithubOidcProviderArn;
    } else if (createGithubOidcProvider) {
      const githubOidc = new iam.OpenIdConnectProvider(this, 'GitHubOidc', {
        url: 'https://token.actions.githubusercontent.com',
        clientIds: ['sts.amazonaws.com'],
        thumbprints: [
          '6938fd4d98bab03faadb97b34396831e3780aea1',
          '1c58a3a8518e8759bf075b76b750d4f2df264fcd',
        ],
      });
      githubOidcArn = githubOidc.openIdConnectProviderArn;
    }

    if (oidcReady && githubOidcArn) {
      const principal = new iam.WebIdentityPrincipal(githubOidcArn, {
        StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${githubOwner}/${githubRepository}:*`,
        },
      });

      const deployRole = new iam.Role(this, 'GitHubDeployRole', {
        roleName: truncateRoleName(`${bucketName}-github-deploy`),
        assumedBy: principal,
        maxSessionDuration: cdk.Duration.hours(1),
      });
      bucket.grantReadWrite(deployRole);
      deployRole.addToPolicy(
        new iam.PolicyStatement({
          actions: ['cloudfront:CreateInvalidation'],
          resources: [
            `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
          ],
        }),
      );

      const cdkRole = new iam.Role(this, 'GitHubCdkRole', {
        roleName: truncateRoleName(`${bucketName}-github-cdk`),
        assumedBy: principal,
        maxSessionDuration: cdk.Duration.hours(1),
      });
      cdkRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'));

      new cdk.CfnOutput(this, 'GitHubActionsDeployRoleArn', {
        description: 'GitHub variable AWS_DEPLOY_ROLE_ARN',
        value: deployRole.roleArn,
        exportName: `${this.stackName}-DeployRoleArn`,
      });

      new cdk.CfnOutput(this, 'GitHubActionsCdkRoleArn', {
        description: 'GitHub variable AWS_CDK_ROLE_ARN (infra workflow)',
        value: cdkRole.roleArn,
        exportName: `${this.stackName}-CdkRoleArn`,
      });
    }

    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'GitHub secret S3_BUCKET',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'GitHub secret CLOUDFRONT_DISTRIBUTION_ID',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
    });

    new cdk.CfnOutput(this, 'PublicSiteUrl', {
      value: useCustomCert
        ? `https://${siteDomain}`
        : `https://${distribution.distributionDomainName}`,
      description: 'GitHub variable PUBLIC_SITE_URL',
    });
  }
}
