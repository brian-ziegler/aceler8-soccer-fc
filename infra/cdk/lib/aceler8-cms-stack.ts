import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface Aceler8CmsStackProps extends cdk.StackProps {
  readonly cmsDomain: string;
  readonly acmCertificateArn: string;
  readonly githubOwner: string;
  readonly githubRepository: string;
  readonly githubTokenParamName: string;
  readonly githubOidcProviderArn: string;
}

export class Aceler8CmsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: Aceler8CmsStackProps) {
    super(scope, id, props);

    const {
      cmsDomain,
      acmCertificateArn,
      githubOwner,
      githubRepository,
      githubTokenParamName,
      githubOidcProviderArn,
    } = props;

    // ── DynamoDB ──────────────────────────────────────────────────────────────
    const table = new dynamodb.Table(this, 'CmsTable', {
      tableName: 'aceler8-cms',
      partitionKey: { name: 'entityType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── SES domain identity ───────────────────────────────────────────────────
    const emailIdentity = new ses.EmailIdentity(this, 'AcelerSesIdentity', {
      identity: ses.Identity.domain('aceler8fc.com'),
    });

    // ── Cognito ───────────────────────────────────────────────────────────────
    const userPool = new cognito.UserPool(this, 'CmsUserPool', {
      userPoolName: 'aceler8-cms-users',
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      email: cognito.UserPoolEmail.withSES({
        fromEmail: 'noreply@aceler8fc.com',
        fromName: 'Aceler8 FC',
        sesVerifiedDomain: 'aceler8fc.com',
        sesRegion: this.region,
      }),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
    userPool.node.addDependency(emailIdentity);

    const userPoolClient = new cognito.UserPoolClient(this, 'CmsUserPoolClient', {
      userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    // ── Cognito groups ────────────────────────────────────────────────────────
    new cognito.CfnUserPoolGroup(this, 'AdminGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'admin',
      description: 'Administrators — full access including user management',
    });

    new cognito.CfnUserPoolGroup(this, 'EditorGroup', {
      userPoolId: userPool.userPoolId,
      groupName: 'editor',
      description: 'Editors — content management access',
    });

    // ── Media bucket ──────────────────────────────────────────────────────────
    const mediaBucket = new s3.Bucket(this, 'CmsMediaBucket', {
      bucketName: 'aceler8-cms-media',
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      }),
      publicReadAccess: true,
      cors: [
        {
          allowedOrigins: ['*'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedHeaders: ['*'],
          maxAge: 3600,
        },
      ],
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // ── Lambda ────────────────────────────────────────────────────────────────
    const cmsLambda = new lambdaNode.NodejsFunction(this, 'CmsApiLambda', {
      functionName: 'aceler8-cms-api',
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: path.join(__dirname, '../lambda/cms-api/index.ts'),
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node22',
        externalModules: [
          '@aws-sdk/client-dynamodb',
          '@aws-sdk/util-dynamodb',
          '@aws-sdk/client-ssm',
          '@aws-sdk/client-s3',
          '@aws-sdk/client-cognito-identity-provider',
        ],
      },
      environment: {
        TABLE_NAME: table.tableName,
        GITHUB_OWNER: githubOwner,
        GITHUB_REPO: githubRepository,
        GITHUB_TOKEN_PARAM: githubTokenParamName,
        CMS_DOMAIN: cmsDomain,
        MEDIA_BUCKET: mediaBucket.bucketName,
        MEDIA_REGION: this.region,
        USER_POOL_ID: userPool.userPoolId,
      },
    });

    table.grantReadWriteData(cmsLambda);
    mediaBucket.grantReadWrite(cmsLambda);

    cmsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter${githubTokenParamName}`],
      }),
    );

    cmsLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'cognito-idp:ListUsers',
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminDeleteUser',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminRemoveUserFromGroup',
          'cognito-idp:AdminListGroupsForUser',
        ],
        resources: [userPool.userPoolArn],
      }),
    );

    // ── API Gateway ───────────────────────────────────────────────────────────
    const api = new apigateway.RestApi(this, 'CmsApi', {
      restApiName: 'aceler8-cms-api',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Authorization', 'Content-Type'],
      },
    });

    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CmsAuthorizer', {
      cognitoUserPools: [userPool],
    });

    const authOptions: apigateway.MethodOptions = {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    };

    const lambdaIntegration = new apigateway.LambdaIntegration(cmsLambda);

    // /api
    const apiResource = api.root.addResource('api');

    // /api/publish
    const publishResource = apiResource.addResource('publish');
    publishResource.addMethod('POST', lambdaIntegration, authOptions);

    // /api/media
    const mediaResource = apiResource.addResource('media');
    mediaResource.addMethod('GET', lambdaIntegration, authOptions);
    const mediaPresignResource = mediaResource.addResource('presign');
    mediaPresignResource.addMethod('POST', lambdaIntegration, authOptions);
    const mediaDeleteResource = mediaResource.addResource('delete');
    mediaDeleteResource.addMethod('POST', lambdaIntegration, authOptions);
    const mediaMoveResource = mediaResource.addResource('move');
    mediaMoveResource.addMethod('POST', lambdaIntegration, authOptions);
    const mediaFolderResource = mediaResource.addResource('folder');
    mediaFolderResource.addMethod('POST', lambdaIntegration, authOptions);

    // /api/users
    const usersResource = apiResource.addResource('users');
    usersResource.addMethod('GET', lambdaIntegration, authOptions);
    usersResource.addMethod('POST', lambdaIntegration, authOptions);
    const singleUserResource = usersResource.addResource('{username}');
    singleUserResource.addMethod('DELETE', lambdaIntegration, authOptions);
    singleUserResource.addMethod('PUT', lambdaIntegration, authOptions);
    const resendResource = singleUserResource.addResource('resend');
    resendResource.addMethod('POST', lambdaIntegration, authOptions);

    // /api/{entity}
    const entityResource = apiResource.addResource('{entity}');
    entityResource.addMethod('GET', lambdaIntegration, authOptions);

    // /api/{entity}/{id}
    const entityIdResource = entityResource.addResource('{id}');
    entityIdResource.addMethod('GET', lambdaIntegration, authOptions);
    entityIdResource.addMethod('PUT', lambdaIntegration, authOptions);
    entityIdResource.addMethod('DELETE', lambdaIntegration, authOptions);

    // ── CMS SPA S3 + CloudFront ───────────────────────────────────────────────
    const cmsBucket = new s3.Bucket(this, 'CmsSpaBucket', {
      bucketName: 'aceler8-cms-spa',
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    const cmsOac = new cloudfront.S3OriginAccessControl(this, 'CmsSpaOAC', {
      signing: cloudfront.Signing.SIGV4_ALWAYS,
      originAccessControlName: 'aceler8-cms-spa-oac',
    });

    const cmsCert = cdk.aws_certificatemanager.Certificate.fromCertificateArn(
      this,
      'CmsAcmCert',
      acmCertificateArn,
    );

    const cmsOrigin = origins.S3BucketOrigin.withOriginAccessControl(cmsBucket, {
      originAccessControl: cmsOac,
    });

    const cmsDistribution = new cloudfront.Distribution(this, 'CmsDistribution', {
      comment: cmsDomain,
      defaultRootObject: 'index.html',
      defaultBehavior: {
        origin: cmsOrigin,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
      ],
      domainNames: [cmsDomain],
      certificate: cmsCert,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // ── GitHub Actions deploy role for CMS SPA ─────────────────────────────────
    const oidcPrincipal = new iam.WebIdentityPrincipal(githubOidcProviderArn, {
      StringEquals: { 'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com' },
      StringLike: {
        'token.actions.githubusercontent.com:sub': `repo:${githubOwner}/${githubRepository}:*`,
      },
    });

    const cmsDeployRole = new iam.Role(this, 'CmsGitHubDeployRole', {
      roleName: 'aceler8-cms-github-deploy',
      assumedBy: oidcPrincipal,
      maxSessionDuration: cdk.Duration.hours(1),
    });

    cmsBucket.grantReadWrite(cmsDeployRole);
    cmsDeployRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['cloudfront:CreateInvalidation'],
        resources: [
          `arn:aws:cloudfront::${this.account}:distribution/${cmsDistribution.distributionId}`,
        ],
      }),
    );

    // ── Grant DDB read to existing site deploy roles ───────────────────────────
    const prodDeployRole = iam.Role.fromRoleName(
      this,
      'ProdDeployRole',
      'aceler8-fc-prod-site-github-deploy',
    );
    const nextDeployRole = iam.Role.fromRoleName(
      this,
      'NextDeployRole',
      'aceler8-fc-next-site-github-deploy',
    );

    table.grantReadData(prodDeployRole);
    table.grantReadData(nextDeployRole);

    // ── Outputs ───────────────────────────────────────────────────────────────
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'GitHub variable CMS_USER_POOL_ID',
    });

    new cdk.CfnOutput(this, 'AppClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'GitHub variable CMS_APP_CLIENT_ID',
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'GitHub variable CMS_API_URL',
    });

    new cdk.CfnOutput(this, 'CmsBucketName', {
      value: cmsBucket.bucketName,
      description: 'GitHub variable CMS_S3_BUCKET',
    });

    new cdk.CfnOutput(this, 'CmsDistributionId', {
      value: cmsDistribution.distributionId,
      description: 'GitHub variable CMS_CLOUDFRONT_ID',
    });

    new cdk.CfnOutput(this, 'CmsDeployRoleArn', {
      value: cmsDeployRole.roleArn,
      description: 'GitHub variable CMS_DEPLOY_ROLE_ARN',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'GitHub variable CMS_TABLE_NAME',
    });

    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: mediaBucket.bucketName,
      description: 'S3 media bucket for CMS image uploads',
    });

    // ── SES DKIM records (add these CNAMEs to aceler8fc.com DNS) ─────────────
    new cdk.CfnOutput(this, 'SesDkimRecord1', {
      value: `${emailIdentity.dkimRecords[0].name} CNAME ${emailIdentity.dkimRecords[0].value}`,
      description: 'DKIM CNAME record 1 — add to aceler8fc.com DNS',
    });
    new cdk.CfnOutput(this, 'SesDkimRecord2', {
      value: `${emailIdentity.dkimRecords[1].name} CNAME ${emailIdentity.dkimRecords[1].value}`,
      description: 'DKIM CNAME record 2 — add to aceler8fc.com DNS',
    });
    new cdk.CfnOutput(this, 'SesDkimRecord3', {
      value: `${emailIdentity.dkimRecords[2].name} CNAME ${emailIdentity.dkimRecords[2].value}`,
      description: 'DKIM CNAME record 3 — add to aceler8fc.com DNS',
    });
  }
}
