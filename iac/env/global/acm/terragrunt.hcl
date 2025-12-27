include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/acm/acm.hcl"
}

locals {
  common   = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
  settings = try(local.common.env_vars.acm_settings, {})

  domain_name = try(local.common.global_vars.root_domain, "domain.com")

  tf_module_version = try(local.settings["tf_module_version"], "v5.1.1")
}

inputs = {
  domain_name = "${local.domain_name}"

  subject_alternative_names = [
    "*.${local.domain_name}"
  ]

  aws_region = "us-east-1"
}
