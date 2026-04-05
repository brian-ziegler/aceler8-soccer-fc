# AWS CLI — Aceler8 Soccer FC

## Project context

| Resource | Value |
|---|---|
| Stack name | `Aceler8SoccerSite` |
| Region | `us-east-1` |
| Account | `125069362169` |
| CDK dir | `infra/cdk/` |
| Bucket | `aceler8-fc-prod-site` |
| CloudFront ID | `E1H9DRMR8GDQIS` |

Static S3 + CloudFront site. IAM roles and OIDC provider are managed outside CDK (created via CLI). CDK manages only S3 bucket and CloudFront distribution.

---

## Identity / auth

```bash
aws sts get-caller-identity
```

## S3

```bash
# List bucket
aws s3 ls s3://aceler8-fc-prod-site/

# Sync build output (mirrors deploy workflow)
aws s3 sync dist/ s3://aceler8-fc-prod-site/ --delete --region us-east-1
```

## CloudFront

```bash
# Invalidate cache (mirrors deploy workflow)
aws cloudfront create-invalidation \
  --distribution-id E1H9DRMR8GDQIS \
  --paths "/*"

# Check invalidation status
aws cloudfront list-invalidations --distribution-id E1H9DRMR8GDQIS
```

## CloudFormation / stack

```bash
# All stack outputs
aws cloudformation describe-stacks \
  --stack-name Aceler8SoccerSite \
  --region us-east-1 \
  --query "Stacks[0].Outputs"

# Stack status
aws cloudformation describe-stacks \
  --stack-name Aceler8SoccerSite \
  --region us-east-1 \
  --query "Stacks[0].StackStatus"

# Recent stack events
aws cloudformation describe-stack-events \
  --stack-name Aceler8SoccerSite \
  --region us-east-1 \
  --query "StackEvents[0:10]"
```

## CDK (run from infra/cdk/)

Config lives in `cdk.json` — no `-c` flags needed.

```bash
cd infra/cdk

# Preview template (no AWS calls)
npx cdk synth

# Diff against deployed stack
npx cdk diff

# Deploy locally (admin credentials)
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=us-east-1
npx cdk deploy --require-approval never
```

## IAM roles (managed outside CDK)

| Role | Purpose |
|---|---|
| `aceler8-fc-prod-site-github-cdk` | AdministratorAccess — assumed by infra workflow |
| `aceler8-fc-prod-site-github-deploy` | S3 + CloudFront invalidation — assumed by deploy workflow |

OIDC provider: `arn:aws:iam::125069362169:oidc-provider/token.actions.githubusercontent.com`
