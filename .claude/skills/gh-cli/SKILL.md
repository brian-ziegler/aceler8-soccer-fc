# gh CLI — Aceler8 Soccer FC

## Repo

`brian-ziegler/aceler8-soccer-fc` — all `gh` commands run from the repo root.

---

## Workflows

```bash
# List recent runs
gh run list --limit 10

# Watch a specific run
gh run watch <run-id> --compact

# Trigger infra workflow manually (deploy.yml is push-only)
gh workflow run infra.yml

# Re-run a failed job
gh run rerun <run-id> --failed

# View logs
gh run view <run-id> --log
gh run view <run-id> --log-failed
```

## Repository variables

```bash
gh variable list

# Required by workflows
gh variable set AWS_CDK_ROLE_ARN   --body "arn:aws:iam::125069362169:role/aceler8-fc-prod-site-github-cdk"
gh variable set AWS_DEPLOY_ROLE_ARN --body "arn:aws:iam::125069362169:role/aceler8-fc-prod-site-github-deploy"
gh variable set PUBLIC_SITE_URL    --body "https://da8l1iis5wdjz.cloudfront.net"
```

## Repository secrets

```bash
gh secret list

# Required by deploy workflow
gh secret set S3_BUCKET                  --body "aceler8-fc-prod-site"
gh secret set CLOUDFRONT_DISTRIBUTION_ID --body "E1H9DRMR8GDQIS"
```

## PRs

```bash
gh pr list
gh pr create --title "..." --body "..."
gh pr view <number>
gh pr merge <number> --squash
```

## Issues

```bash
gh issue list
gh issue create --title "..." --body "..."
```

## Typical infra deploy flow

1. Edit `infra/cdk/lib/aceler8-site-stack.ts` or `infra/cdk/cdk.json`
2. `cd infra/cdk && npx cdk diff` — preview changes
3. Commit and push to `main` — `infra.yml` runs automatically
4. `gh run watch <run-id> --compact` — monitor
5. If stack outputs changed, update secrets/variables from the new outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name Aceler8SoccerSite \
     --region us-east-1 \
     --query "Stacks[0].Outputs"
   ```
