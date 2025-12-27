include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/vpc/sg.hcl"
}

## Dependencies:
dependencies {
  paths = [
    "${dirname(find_in_parent_folders("region.hcl"))}/security-groups/alb"
  ]
}

# dependency "sg_ecs_alb" {
#   config_path = "${dirname(find_in_parent_folders("region.hcl"))}/security-groups/alb"
#   mock_outputs = {
#     security_group_id = "sg-123456789"
#   }
#   mock_outputs_allowed_terraform_commands = ["validate", "plan", "apply", "destroy"]
# }

## Variables:
locals {
  common        = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
  settings      = try(local.common.env_vars.sg_settings, {})
  whitelist_ips = try(local.common.global_vars.whitelist_ips, {})
}

inputs = {
  ingress_with_self       = []
  egress_ipv6_cidr_blocks = []
  ingress_cidr_blocks     = ["0.0.0.0/0"]

  ingress_with_cidr_blocks = concat([for k, v in local.whitelist_ips :
    {
      cidr_blocks = v
      description = "${upper(k)} - HTTP"
      rule        = "ssh-tcp"
    }
  ],
  [
    {
      from_port   = 8080
      to_port     = 8080
      protocol    = "tcp"
      description = "backend api port"
      cidr_blocks = "0.0.0.0/0"
    
    },
    {
      from_port   = 3000
      to_port     = 3000
      protocol    = "tcp"
      description = "frontend port"
      cidr_blocks = "0.0.0.0/0"
    },
  ]
  )
}
