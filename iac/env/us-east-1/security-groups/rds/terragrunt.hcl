include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/vpc/sg.hcl"
}

## Dependencies:
dependencies {
  paths = [
    "${dirname(find_in_parent_folders("region.hcl"))}/security-groups/ecs",
    "${dirname(find_in_parent_folders("region.hcl"))}/security-groups/lambda"
  ]
}


dependency "ecs_sg" {
  config_path = "${dirname(find_in_parent_folders("region.hcl"))}/security-groups/ecs"
  mock_outputs = {
    security_group_id = "sg-123456789"
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan", "apply", "destroy"]
}

dependency "lambda_sg" {
  config_path = "${dirname(find_in_parent_folders("region.hcl"))}/security-groups/lambda"
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
  # ingress_cidr_blocks     = ["0.0.0.0/0"]
  ingress_with_source_security_group_id = [
    {
      rule                     = "mysql-tcp"
      description              = "allow access DB from ecs"
      source_security_group_id = dependency.ecs_sg.outputs.security_group_id
    },
    {
      rule                     = "mysql-tcp"
      description              = "allow access DB from lambda"
      source_security_group_id = dependency.lambda_sg.outputs.security_group_id
    }
  ]
}
