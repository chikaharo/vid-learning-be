include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/vpc/sg.hcl"
}

## Dependencies:
dependencies {
  paths = [
    "${dirname(find_in_parent_folders("region.hcl"))}/security-groups/agw"
  ]
}

dependency "sg_agw" {
  config_path = "${dirname(find_in_parent_folders("region.hcl"))}/security-groups/agw"
  mock_outputs = {
    security_group_id = "sg-123456789"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan", "apply", "destroy"]
}

## Variables:
locals {
  common        = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
  settings      = try(local.common.env_vars.sg_settings, {})
  whitelist_ips = try(local.common.global_vars.whitelist_ips, {})
}

inputs = {
  ingress_with_self       = []
  egress_ipv6_cidr_blocks = []
  ingress_rules           = []
  ingress_cidr_blocks     = ["0.0.0.0/0"]
  ingress_with_source_security_group_id = [
    {
      rule                     = "all-tcp"
      description              = "allow access ${local.common.name} from ALB"
      source_security_group_id = dependency.sg_agw.outputs.security_group_id
    }
  ]
}
