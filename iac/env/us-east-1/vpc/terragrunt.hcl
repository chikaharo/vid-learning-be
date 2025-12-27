include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path   = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/vpc/${basename(get_terragrunt_dir())}.hcl"
  expose = true
}

## Variables:
inputs = {
}
