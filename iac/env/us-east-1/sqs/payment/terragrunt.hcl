include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/sqs/sqs.hcl"
}

locals {
  common = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals

  name = "${local.common.name}-sqs"
}

## Variables:
inputs = {
  name = local.name
}
