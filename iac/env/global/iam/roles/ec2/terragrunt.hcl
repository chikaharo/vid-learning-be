include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/iam/iam-role.hcl"
}

## Dependencies:

## Variables:
locals {
  common = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
  name   = "${local.common.global_vars.project_name}-ecsTaskExecutionRole"
}

inputs = {
  role_name               = "${local.common.name}-role"
  role_description        = ""
  trusted_role_services   = ["ec2.amazonaws.com"]
  create_instance_profile = true
  custom_role_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceRole",
  ]
}
