include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/compute/ec2.hcl"
}

## Dependencies
dependencies {
  paths = [
    for path in [
      "${local.region_path}/keypair",
      "${local.region_path}/security-groups/ec2",
      "${local.root_path}/env/global/iam/roles/ec2"
    ] : path if fileexists("${path}/terragrunt.hcl")
  ]
}
dependency "keypair" {
  config_path = "${local.region_path}/keypair"
  mock_outputs = {
    key_pair_name = ""
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan", "apply", "destroy"]
}

dependency "sg" {
  config_path = "${local.region_path}/security-groups/ec2"
  mock_outputs = {
    security_group_id = ""
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan", "apply", "destroy"]
}

dependency "bastion-role" {
  config_path = "${local.root_path}/env/global/iam/roles/ec2"
  mock_outputs = {
    iam_instance_profile_arn = ""
  }
  mock_outputs_allowed_terraform_commands = ["validate", "plan", "apply", "destroy"]
}


locals {
  common      = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
  settings    = try(local.common.env_vars.ec2_settings, {})
  root_path   = dirname(find_in_parent_folders("root.hcl"))
  region_path = dirname(find_in_parent_folders("region.hcl"))

}

inputs = {
  key_name                 = dependency.keypair.outputs.key_pair_name
  vpc_security_group_ids   = [dependency.sg.outputs.security_group_id]
  iam_instance_profile_arn = dependency.bastion-role.outputs.iam_instance_profile_arn
}
