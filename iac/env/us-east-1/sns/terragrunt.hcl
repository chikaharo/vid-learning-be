include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/sns/sns.hcl"
}

## Variables:
inputs = {
  subscriptions = {
    mail = {
      protocol = "email"
      endpoint = "huybd@hblab.vn"
    }
  }
}
