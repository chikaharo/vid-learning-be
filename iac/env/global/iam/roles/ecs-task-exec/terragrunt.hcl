include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/iam/iam-role.hcl"
}

locals {
  common = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
  name   = "${local.common.global_vars.project_name}-ecsTaskExecutionRole"
  bname  = local.common.basename
}


## Variables:
inputs = {
  trusted_role_services   = ["ec2.amazonaws.com", "ecs-tasks.amazonaws.com"]
  create_instance_profile = false
  custom_role_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
  ]
  policy_file = "${dirname(find_in_parent_folders("root.hcl"))}/_templates/iam/${local.bname}.json.tpl"
  s3_resources = [
    "arn:aws:s3:::${local.common.name}*",
    "arn:aws:s3:::${local.common.name}*/*",
  ]
}
