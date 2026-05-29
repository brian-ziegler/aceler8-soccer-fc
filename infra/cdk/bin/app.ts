#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Aceler8SiteStack } from '../lib/aceler8-site-stack';
import { Aceler8CmsStack } from '../lib/aceler8-cms-stack';
import { Aceler8DnsStack } from '../lib/aceler8-dns-stack';

const app = new cdk.App();

function requireContext(key: string): string {
  const v = app.node.tryGetContext(key);
  if (v === undefined || v === null || String(v).trim() === '') {
    throw new Error(
      `Missing CDK context "${key}". Pass -c ${key}=... or add to cdk.json context (see README).`,
    );
  }
  return String(v).trim();
}

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

// ── Production stack ──────────────────────────────────────────────────────────
const bucketName = requireContext('bucketName');
const siteDomain = requireContext('siteDomain');
const additionalDomains = app.node.tryGetContext('additionalDomains') as string[] | undefined;
const githubOwner = app.node.tryGetContext('githubOwner');
const githubRepository = app.node.tryGetContext('githubRepository');
const acmCertificateArn = app.node.tryGetContext('acmCertificateArn');
const createGithubOidc =
  app.node.tryGetContext('createGithubOidcProvider') === false ||
  app.node.tryGetContext('createGithubOidcProvider') === 'false'
    ? false
    : true;
const existingGithubOidcProviderArn = app.node.tryGetContext('githubOidcProviderArn');

new Aceler8SiteStack(app, 'Aceler8SoccerSite', {
  env,
  bucketName,
  siteDomain,
  additionalDomains: additionalDomains ?? [],
  githubOwner: githubOwner ? String(githubOwner).trim() : undefined,
  githubRepository: githubRepository ? String(githubRepository).trim() : undefined,
  acmCertificateArn: acmCertificateArn ? String(acmCertificateArn).trim() : undefined,
  createGithubOidcProvider: createGithubOidc,
  existingGithubOidcProviderArn: existingGithubOidcProviderArn
    ? String(existingGithubOidcProviderArn).trim()
    : undefined,
});

// ── Next (preview) stack ──────────────────────────────────────────────────────
const nextBucketName = app.node.tryGetContext('next:bucketName') as string | undefined;
const nextSiteDomain = app.node.tryGetContext('next:siteDomain') as string | undefined;

if (nextBucketName && nextSiteDomain) {
  const nextGithubOwner = app.node.tryGetContext('next:githubOwner') as string | undefined;
  const nextGithubRepo = app.node.tryGetContext('next:githubRepository') as string | undefined;
  const nextOidcArn = app.node.tryGetContext('next:githubOidcProviderArn') as string | undefined;
  const nextAcmArn = app.node.tryGetContext('next:acmCertificateArn') as string | undefined;
  const nextAdditionalDomains = app.node.tryGetContext('next:additionalDomains') as string[] | undefined;

  new Aceler8SiteStack(app, 'Aceler8SoccerSiteNext', {
    env,
    bucketName: nextBucketName,
    siteDomain: nextSiteDomain,
    additionalDomains: nextAdditionalDomains ?? [],
    githubOwner: nextGithubOwner?.trim(),
    githubRepository: nextGithubRepo?.trim(),
    acmCertificateArn: nextAcmArn?.trim(),
    createGithubOidcProvider: false,
    existingGithubOidcProviderArn: nextOidcArn?.trim(),
  });
}

// ── CMS stack ─────────────────────────────────────────────────────────────────
const cmsSiteDomain = app.node.tryGetContext('cms:siteDomain') as string | undefined;

if (cmsSiteDomain) {
  const cmsAcmCertificateArn = app.node.tryGetContext('cms:acmCertificateArn') as string;
  const cmsGithubOwner = app.node.tryGetContext('cms:githubOwner') as string;
  const cmsGithubRepository = app.node.tryGetContext('cms:githubRepository') as string;
  const cmsGithubTokenParamName = app.node.tryGetContext('cms:githubTokenParamName') as string;
  const cmsGithubOidcProviderArn = app.node.tryGetContext('cms:githubOidcProviderArn') as string;

  new Aceler8CmsStack(app, 'Aceler8CmsStack', {
    env,
    cmsDomain: cmsSiteDomain,
    acmCertificateArn: cmsAcmCertificateArn,
    githubOwner: cmsGithubOwner,
    githubRepository: cmsGithubRepository,
    githubTokenParamName: cmsGithubTokenParamName,
    githubOidcProviderArn: cmsGithubOidcProviderArn,
  });
}

// ── DNS stack (Route 53 hosted zone for aceler8fc.com) ────────────────────────
new Aceler8DnsStack(app, 'Aceler8DnsStack', { env });

app.synth();
