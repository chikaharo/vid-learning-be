
include "root" {
  path = find_in_parent_folders("root.hcl")
}
include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/compute/keypair.hcl"
}
locals {
  common   = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
  settings = try(local.common.env_vars.ecr_settings, {})
}
inputs = {
}