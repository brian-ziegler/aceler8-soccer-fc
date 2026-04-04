variable "aws_region" {
  description = "AWS region for S3 bucket and CloudFront origin"
  type        = string
  default     = "us-east-1"
}

variable "site_domain" {
  description = "Primary hostname (no protocol), used for aliases and CORS-style notes"
  type        = string
}

variable "bucket_name" {
  description = "Globally unique S3 bucket name for static assets"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class (e.g. PriceClass_100 for US/EU only)"
  type        = string
  default     = "PriceClass_100"
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 for custom domain (optional — leave empty to use CloudFront default domain only)"
  type        = string
  default     = ""
}
