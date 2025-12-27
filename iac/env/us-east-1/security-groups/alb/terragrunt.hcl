include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/vpc/sg.hcl"
}

## Dependencies:

## Variables:
locals {
  common        = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
  settings      = try(local.common.env_vars.sg_settings, {})
  whitelist_ips = try(local.common.global_vars.whitelist_ips, {})
}

inputs = {
  ingress_with_self       = []
  egress_ipv6_cidr_blocks = []
  ingress_rules           = ["http-80-tcp", "https-443-tcp"]
  ingress_cidr_blocks     = ["0.0.0.0/0"]

  # ingress_with_cidr_blocks = concat(
  #   [
  #     for k, v in local.mnt_ips :
  #     {
  #       cidr_blocks = v
  #       description = "${upper(k)} - HTTP"
  #       rule        = "http-80-tcp"
  #     }

  #   ],
  #   [
  #     for k, v in local.mnt_ips :
  #     {
  #       cidr_blocks = v
  #       description = "${upper(k)} - HTTP"
  #       rule        = "https-443-tcp"
  #     }
  #   ]
  # )
}
