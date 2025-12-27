include "root" {
  path = find_in_parent_folders("root.hcl")
}
include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/iam/oidc.hcl"
}

locals {
  common = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
}

inputs = {
  oidc_roles = {
    gitlab = {
      role_name   = "hblab-${local.common.name}-gitlab"
      role_desc   = "Allow access from https://git.hblab.vn/ projects"
      policy_arns = []

      match_value = [
        "project_path:hbg/pro-g_248-mims-terminology-server-mapping/pro-g_248_be:ref_type:branch:ref:master",
        "project_path:hbg/pro-g_248-mims-terminology-server-mapping/pro-g_248_be:ref_type:branch:ref:hotfix/cicd*",
        "project_path:hbg/pro-g_248-mims-terminology-server-mapping/pro-g_248_be:ref_type:branch:ref:feat/cicd"
      ]

      inline_policy_statements = [
        {
          sid = "S3StateAccess"
          actions = [
            "s3:List*",
            "s3:Get*",
            "s3:Put*",
            "s3:CreateBucket*",
          ]
          effect    = "Allow"
          resources = ["*"]
        },
        {
          sid = "ECRFullAccess"
          actions = [
            "ecr:*",
          ]
          effect    = "Allow"
          resources = ["*"]
        },
        {
          sid = "ECSFullAccess"
          actions = [
            "iam:PassRole",
            "ecs:*",

          ]
          effect    = "Allow"
          resources = ["*"]
        },
        {
          sid       = "Assume2OrgAccounts"
          effect    = "Allow"
          actions   = ["sts:AssumeRole"]
          resources = ["arn:aws:iam::346296963666:role/HblabInfraAdminRole"]
        }
      ]
    }
  }
}
