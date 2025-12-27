include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/alb/${basename(get_terragrunt_dir())}.hcl"
}

## Variables:
locals {
  common   = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
  settings = try(local.common.env_vars.alb_settings, {})
}

inputs = {
}
