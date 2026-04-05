# AWS & GitHub CLI Guide — Aceler8 Soccer FC

## Project context

| Resource | Value |
|---|---|
| Stack name | `Aceler8SoccerSite` |
| Region | `us-east-1` |
| CDK dir | `infra/cdk/` |
| GitHub repo var | `CDK_GITHUB_REPO` / `CDK_GITHUB_OWNER` |

The site is a static S3 + CloudFront deployment managed by CDK. GitHub Actions uses OIDC (no long-lived AWS keys).

---

## AWS CLI — common operations

### Identity / auth check
```bash
aws sts get-caller-identity
```

### S3
```bash
# List bucket contents
aws s3 ls s3://<bucket>/

# Sync build output (mirrors what the deploy workflow does)
aws s3 sync dist/ s3://<bucket>/ --delete

# Get bucket name from stack output
aws cloudformation describe-stacks \
  --stack-name Aceler8SoccerSite \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text
```

### CloudFront
```bash
# Get distribution ID from stack output
aws cloudformation describe-stacks \
  --stack-name Aceler8SoccerSite \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" \
  --output text

# Invalidate cache (mirrors what the deploy workflow does)
aws cloudfront create-invalidation \
  --distribution-id <id> \
  --paths "/*"

# Check invalidation status
aws cloudfront list-invalidations --distribution-id <id>
```

### CloudFormation / CDK stack
```bash
# List all stack outputs
aws cloudformation describe-stacks \
  --stack-name Aceler8SoccerSite \
  --query "Stacks[0].Outputs"

# Check stack status
aws cloudformation describe-stacks \
  --stack-name Aceler8SoccerSite \
  --query "Stacks[0].StackStatus"

# Tail stack events (useful after a CDK deploy)
aws cloudformation describe-stack-events \
  --stack-name Aceler8SoccerSite \
  --query "StackEvents[0:10]"
```

### CDK (run from infra/cdk/)

Config lives in `cdk.json` context — no `-c` flags needed.

```bash
cd infra/cdk

# Synth (renders CloudFormation template, no AWS calls)
npx cdk synth

# Diff against deployed stack
npx cdk diff

# Deploy (requires CDK_DEFAULT_ACCOUNT set)
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=us-east-1
npx cdk deploy --require-approval never
```

---

## gh CLI — common operations

### Workflows
```bash
# List workflow runs
gh run list --limit 10

# Watch a running workflow
gh run watch

# Trigger the infra workflow manually
gh workflow run infra.yml

# Re-run a failed run
gh run rerun <run-id>

# View logs for a run
gh run view <run-id> --log
```

### Repository variables & secrets (used by workflows)
```bash
# List variables
gh variable list

# Set a variable (e.g. after CDK deploy outputs new ARN)
gh variable set AWS_DEPLOY_ROLE_ARN --body "arn:aws:iam::..."
gh variable set CDK_BUCKET_NAME --body "<bucket-name>"
gh variable set CDK_SITE_DOMAIN --body "<domain>"
gh variable set CDK_GITHUB_OWNER --body "<owner>"
gh variable set CDK_GITHUB_REPO --body "<repo>"

# List secrets (values hidden)
gh secret list

# Set a secret
gh secret set S3_BUCKET --body "<bucket-name>"
gh secret set CLOUDFRONT_DISTRIBUTION_ID --body "<dist-id>"
```

### PRs
```bash
gh pr list
gh pr create --title "..." --body "..."
gh pr view <number>
gh pr merge <number> --squash
```

### Issues
```bash
gh issue list
gh issue create --title "..." --body "..."
```

---

## Typical workflow: deploy infra changes

1. Edit `infra/cdk/lib/aceler8-site-stack.ts` or `infra/cdk/cdk.json`
2. `cd infra/cdk && npx cdk diff` — review changes
3. Commit and push to `main` — the `infra.yml` workflow runs automatically
4. `gh run watch` — monitor the CDK deploy
5. If new stack outputs appeared, update repo variables:
   ```bash
   gh variable set AWS_DEPLOY_ROLE_ARN --body "$(aws cloudformation describe-stacks \
     --stack-name Aceler8SoccerSite \
     --query "Stacks[0].Outputs[?OutputKey=='GitHubActionsDeployRoleArn'].OutputValue" \
     --output text)"
   ```
