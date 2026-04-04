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

Copy `.env.example` to `.env` for local persistence. In GitHub Actions, set repository variable **`PUBLIC_SITE_URL`** to the same value.

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

**Repository secrets**

| Secret | Description |
| --- | --- |
| `AWS_ACCESS_KEY_ID` | IAM user or role access key |
| `AWS_SECRET_ACCESS_KEY` | IAM secret |
| `AWS_REGION` | e.g. `us-east-1` |
| `S3_BUCKET` | Bucket name from Terraform output |
| `CLOUDFRONT_DISTRIBUTION_ID` | Distribution ID from Terraform output |

**Repository variables**

| Variable | Example |
| --- | --- |
| `PUBLIC_SITE_URL` | `https://www.aceler8fc.org` |

On every push to `main`, the workflow runs `npm ci`, `npm run build`, `aws s3 sync dist/ s3://$S3_BUCKET/ --delete`, and invalidates `/*` on CloudFront.

### `robots.txt` and sitemap URL

Update [`public/robots.txt`](public/robots.txt) so the `Sitemap:` line matches your real domain (it must align with `PUBLIC_SITE_URL` for consistency).

## AWS infrastructure (Terraform)

Configuration lives in [`infra/terraform/`](infra/terraform/).

**Recommendation**: Terraform over CDK for this footprint — a single distribution, one bucket, and OAC are a few resources; HCL stays easy for volunteers to read and tweak.

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars — bucket name must be globally unique

terraform init
terraform apply
```

**Outputs**: `s3_bucket_name`, `cloudfront_distribution_id`, `cloudfront_domain_name`.

**Custom domain**: Request an ACM certificate in **us-east-1**, validate (usually DNS), set `acm_certificate_arn` in `terraform.tfvars`. Leave it empty to use the default `*.cloudfront.net` hostname first.

**404 behavior**: CloudFront serves `/404.html` for 403/404 responses (common for S3 REST origins when a key is missing).

### Bucket policy note

The policy allows `s3:GetObject` for objects when the request comes from your CloudFront distribution (OAC). The policy references the distribution ARN; Terraform resolves apply order in one run, but if you ever see a transient failure, run `terraform apply` again.

## Content source

Coach bios and program language are adapted from the training/camp brand at [aceler8soccer.com](https://aceler8soccer.com/) (Connally Edozien, Betsy Jones, Carmen Stagnitta; ACES / academy messaging). Replace placeholders (email, phone, affiliation line in `src/data/site.ts`) before high-visibility events.

## `@astrojs/sitemap` version

The integration is pinned to **3.2.1** for compatibility with **Astro 4.x**. Newer `@astrojs/sitemap` majors target Astro 5/6 and can break the build hook API.
