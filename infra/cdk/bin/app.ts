#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Aceler8SiteStack } from '../lib/aceler8-site-stack';

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

const bucketName = requireContext('bucketName');
const siteDomain = requireContext('siteDomain');
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
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  bucketName,
  siteDomain,
  githubOwner: githubOwner ? String(githubOwner).trim() : undefined,
  githubRepository: githubRepository ? String(githubRepository).trim() : undefined,
  acmCertificateArn: acmCertificateArn ? String(acmCertificateArn).trim() : undefined,
  createGithubOidcProvider: createGithubOidc,
  existingGithubOidcProviderArn: existingGithubOidcProviderArn
    ? String(existingGithubOidcProviderArn).trim()
    : undefined,
});

app.synth();
