include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/vpc/sg.hcl"
}

## Dependencies:

## Variables:
locals {
  common   = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
  settings = try(local.common.env_vars.sg_settings, {})

  whitelist_ips = try(local.common.global_vars.whitelist_ips, {})
  cicd_ip       = try(local.common.vpc_settings.cicd_ip, {})
}

inputs = {
  ingress_with_self       = []
  egress_ipv6_cidr_blocks = []

  ingress_with_cidr_blocks = [for k, v in local.whitelist_ips :
    {
      cidr_blocks = v
      description = "${upper(k)} - HTTP"
      rule        = "http-80-tcp"
    }
  ]

  ingress_with_cidr_blocks = [for k, v in local.whitelist_ips :
    {
      cidr_blocks = v
      description = "${upper(k)} - HTTP"
      rule        = "https-443-tcp"
    }
  ]

  #   ingress_with_source_security_group_id = [
  #     {
  #       rule                     = "http-80-tcp"
  #       description              = "allow access Bastion from LB"
  #       source_security_group_id = dependency.sg_lb.outputs.security_group_id
  #     },
  #   ]
}
