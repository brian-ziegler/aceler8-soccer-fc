# Aceler8 Soccer FC — club website

Static marketing and credibility site for the **U11 girls competitive team**. Built with [Astro](https://astro.build/) for fast static output, strong SEO, and a clear path to add dynamic features later (content collections, API routes, or partial hydration).

## Why Astro (decision record)

- **Static-first**: HTML/CSS by default — ideal for **S3 + CloudFront** and minimal hosting cost.
- **SEO**: Per-route `<head>` control, clean URLs with `trailingSlash: 'always'` (matches S3 “folder” objects), and `@astrojs/sitemap` for `sitemap-index.xml`.
- **Future growth**: Optional [content collections](https://docs.astro.build/en/guides/content-collections/) for schedules/rosters/news; [View Transitions](https://docs.astro.build/en/guides/view-transitions/) or islands if you add dashboards later.
- **Alternatives considered**: Next.js static export adds more JS/runtime surface than this project needs; plain HTML scales poorly once you have many pages and shared layouts.

## Sitemap (information architecture)

| Route | Purpose |
| --- | --- |
| `/` | Home — positioning, trust strip, paths for TDs vs. community |
| `/about/` | Mission, vision, values; separation from camp brand |
| `/team/` | Competitive identity and development model |
| `/coaches/` | Staff index |
| `/coaches/[slug]/` | Individual coach pages (credentials + bios for verification) |
| `/schedule/` | Competition calendar (placeholder table — easy to replace with CMS or collections) |
| `/tournament-directors/` | Trust-focused quick facts and verification lane |
| `/contact/` | Email/phone/social (no recruitment forms) |

**Rationale**: Mirrors what elite youth programs surface (staff, program story, competition context) while avoiding tryout/join flows. The **Tournament desk** page answers “who do I email?” without burying contact details in a generic footer.

## Local development

Requirements: Node.js 20+ (recommended; matches GitHub Actions).

```bash
npm install
npm run dev
```

Build and preview the static output:

```bash
npm run build
npm run preview
```

### Production URL at build time

Canonical URLs, Open Graph URLs, and the sitemap use `PUBLIC_SITE_URL` (no trailing slash).

```bash
# Windows PowerShell
$env:PUBLIC_SITE_URL="https://www.your-domain.com"; npm run build
```

Copy `.env.example` to `.env` for local persistence. In GitHub Actions, set repository variable **`PUBLIC_SITE_URL`** to the stack output **`PublicSiteUrl`** (or your custom domain once DNS points at CloudFront).

### Swap placeholder images

1. **Coach photos & hero**: Edit `src/data/coaches.ts` (`imageSrc`, `imageAlt`) and inline URLs in `src/pages/index.astro`, `src/pages/team.astro` if needed.
2. **Production**: Prefer storing assets in `public/images/` and referencing `/images/...` so you are not tied to external CDNs.
3. **Alt text**: Replace placeholder language (“replace with …”) when real photography ships.

### Update club colors and typography

- **Colors and theme tokens**: `src/styles/global.css` — edit `--color-primary`, `--color-accent`, and the `[data-theme='light']` / `[data-theme='dark']` blocks. `@media (prefers-color-scheme: dark)` controls the default when users choose **Auto** (system).
- **Fonts**: The same file loads **Fraunces** (display) and **Source Sans 3** (body) from Google Fonts — change the `@import` and `--font-*` variables.

### Theme toggle

- **Auto**: Clears `localStorage` key `aceler8-theme` and removes `data-theme` from `<html>` so `prefers-color-scheme` applies.
- **Manual**: Sets `data-theme` to `light` or `dark`.

## Deployment (GitHub Actions → S3 → CloudFront)

Workflow: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

AWS access uses **[GitHub OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services)** (no long‑lived `AWS_ACCESS_KEY_*` in GitHub). The CDK stack in [`infra/cdk`](infra/cdk) creates the GitHub OIDC provider and IAM roles.

**Repository variables**

| Variable | Example |
| --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | CloudFormation output **`GitHubActionsDeployRoleArn`** from stack `Aceler8SoccerSite` |
| `PUBLIC_SITE_URL` | Output **`PublicSiteUrl`**, or your custom domain when DNS is ready |

**Repository secrets**

| Secret | Description |
| --- | --- |
| `S3_BUCKET` | Output **`BucketName`** |
| `CLOUDFRONT_DISTRIBUTION_ID` | Output **`CloudFrontDistributionId`** |

Workflow permissions include **`id-token: write`** so `aws-actions/configure-aws-credentials` can assume the deploy role via OIDC. STS calls use **`us-east-1`**.

On every push to `main`, the workflow runs `npm ci`, `npm run build`, `aws s3 sync dist/ s3://$S3_BUCKET/ --delete`, and invalidates `/*` on CloudFront.

**Bootstrap:** Run the first **`cdk deploy`** from your machine with an admin-capable AWS identity so the stack (including OIDC + roles) exists. Copy outputs into GitHub variables/secrets (`AWS_DEPLOY_ROLE_ARN`, `AWS_CDK_ROLE_ARN`, `S3_BUCKET`, etc.). After that, the **infra** workflow can manage the stack via OIDC.

### `robots.txt` and sitemap URL

Update [`public/robots.txt`](public/robots.txt) so the `Sitemap:` line matches your real domain (it must align with `PUBLIC_SITE_URL` for consistency).

## AWS infrastructure (AWS CDK)

Infrastructure lives in [`infra/cdk`](infra/cdk) (TypeScript, **AWS CDK v2** → CloudFormation). **Why CDK:** typed constructs, reuse and tests in TypeScript, and AWS-managed stack state (no separate Terraform backend). The stack provisions the **site S3 bucket**, **CloudFront + S3 OAC**, **custom error mapping** to `/404.html`, optional **ACM + alternate domain names**, and **GitHub OIDC** with two roles: least-privilege **deploy** (S3 sync + invalidation) and **CDK** (`AdministratorAccess` for `cdk deploy` in CI — replace with a scoped policy when you harden).

### One-time: CDK bootstrap

Once per account/region:

```bash
cd infra/cdk
npm install
npx cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1
```

### Local deploy (first time / admin)

All config lives in [`infra/cdk/cdk.json`](infra/cdk/cdk.json) (`context` block). No `-c` flags needed.

```bash
cd infra/cdk
export CDK_DEFAULT_ACCOUNT=YOUR_ACCOUNT_ID   # PowerShell: $env:CDK_DEFAULT_ACCOUNT="..."
export CDK_DEFAULT_REGION=us-east-1
npx cdk deploy
```

**Stack outputs** (for GitHub): `BucketName`, `CloudFrontDistributionId`, `PublicSiteUrl`, `GitHubActionsDeployRoleArn`, `GitHubActionsCdkRoleArn`.

### CI: CDK workflow

[`.github/workflows/infra.yml`](.github/workflows/infra.yml) runs **`npm ci`** and **`cdk deploy`** when **`infra/**`** changes on `main` (or via **workflow_dispatch**). Config is read from `cdk.json` — no extra repository variables needed beyond the role ARN.

**Repository variables** (required for CI)

| Variable | Purpose |
| --- | --- |
| `AWS_CDK_ROLE_ARN` | Output **`GitHubActionsCdkRoleArn`** — OIDC role assumed by this workflow |

After deploy, copy stack outputs into **`S3_BUCKET`**, **`CLOUDFRONT_DISTRIBUTION_ID`**, **`PUBLIC_SITE_URL`**, **`AWS_DEPLOY_ROLE_ARN`**, and **`AWS_CDK_ROLE_ARN`** (e.g. with `gh secret set` / `gh variable set`).

**Custom domain**: Add `acmCertificateArn` to the `context` block in `cdk.json` (cert must be in **us-east-1**).

**404 behavior**: CloudFront maps 403/404 to `/404.html` (same as before).

### OAC / bucket access

CDK’s **S3 origin + OAC** grants CloudFront read access via the generated bucket policy; the bucket stays private to the public internet.

## Content source

Coach bios and program language are adapted from the training/camp brand at [aceler8soccer.com](https://aceler8soccer.com/) (Connally Edozien, Betsy Jones, Carmen Stagnitta; ACES / academy messaging). Replace placeholders (email, phone, affiliation line in `src/data/site.ts`) before high-visibility events.

## `@astrojs/sitemap` version

The integration is pinned to **3.2.1** for compatibility with **Astro 4.x**. Newer `@astrojs/sitemap` majors target Astro 5/6 and can break the build hook API.
