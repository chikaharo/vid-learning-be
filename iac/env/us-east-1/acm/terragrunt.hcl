include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/acm/acm.hcl"
}

## Variables:
locals {
  common       = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
  settings     = try(local.common.env_vars.acm_settings, {})
  alb_settings = try(local.common.env_vars.alb_settings, {})

  domain_name = try(local.common.global_vars.root_domain, "domain.com")
  aws_region  = "${dirname(find_in_parent_folders("region.hcl"))}"
}

inputs = {
  domain_name = "${local.domain_name}"

  subject_alternative_names = [
    "*.${local.domain_name}"
  ]

  # aws_region = local.aws_region
  wait_for_validation    = true
  validate_certificate   = true
  create_route53_records = false
}
