include "root" {
  path = find_in_parent_folders("root.hcl")
}

include "envcommon" {
  path   = "${dirname(find_in_parent_folders("root.hcl"))}/_envcommon/cloudfront/cloudfront.hcl"
  expose = true
}

## Dependencies:
dependencies {
  paths = [
    "${dirname(find_in_parent_folders("root.hcl"))}/env/${local.aws_main_region}/s3/assets",
    "${dirname(find_in_parent_folders("root.hcl"))}/env/${local.aws_main_region}/alb",
  ]
}

# dependency "bucket" {
#   config_path = "${dirname(find_in_parent_folders("root.hcl"))}/env/${local.aws_main_region}/s3/assets"
#   mock_outputs = {
#     s3_bucket_bucket_domain_name = "s3-bucket.s3.amazonaws.com"
#   }
#   mock_outputs_allowed_terraform_commands = ["validate", "plan", "apply", "destroy"]
# }

# dependency "alb" {
#   config_path = "${dirname(find_in_parent_folders("root.hcl"))}/env/${local.aws_main_region}/alb"
#   mock_outputs = {
#     arn      = "arn:aws:elasticloadbalancing:us-east-1:123456789:loadbalancer/app/test-alb/8c3ad72d3ad17c79"
#     dns_name = "test-alb.us-east-1.elb.amazonaws.com"
#   }
#   mock_outputs_allowed_terraform_commands = ["validate", "plan", "apply", "destroy"]
# }

## Variables:
locals {
  common   = read_terragrunt_config("${dirname(find_in_parent_folders("root.hcl", "./root.hcl"))}/_envcommon/common.hcl").locals
  settings = try(local.common.env_vars.cf_settings, {})

  aws_main_region = local.common.global_vars.main_region
}

inputs = {
  # create_vpc_origin = try(local.settings.create_vpc_origin, false)
  # vpc_origin = {
  #   alb_vpc_origin = {
  #     name                   = "${local.common.name}-vpc-origin"
  #     arn                    = dependency.alb.outputs.arn
  #     http_port              = 80
  #     https_port             = 443
  #     origin_protocol_policy = "match-viewer"
  #     origin_ssl_protocols   = ["TLSv1.2"]
  #   }
  # }

  # origin = merge(
  #   {
  #     s3 = {
  #       domain_name           = dependency.bucket.outputs.s3_bucket_bucket_domain_name
  #       origin_access_control = "s3_oac_${local.common.env}"
  #     }
  #     alb = {
  #       domain_name = dependency.alb.outputs.dns_name
  #       # custom_origin_config = {
  #       #   http_port              = 80
  #       #   https_port             = 443
  #       #   origin_protocol_policy = "match-viewer"
  #       #   origin_ssl_protocols   = ["TLSv1", "TLSv1.1", "TLSv1.2"]
  #       # }
  #       vpc_origin_config = {
  #         vpc_origin = "alb_vpc_origin"
  #       }
  #     }
  #   }
  # )

  # ordered_cache_behavior = [
  #   {
  #     path_pattern           = "/api/*"
  #     target_origin_id       = "alb"
  #     viewer_protocol_policy = try(local.settings["behavior"]["viewer_protocol_policy"], "https-only")

  #     allowed_methods = try(local.settings["behavior"]["allowed_methods"], ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"])
  #     cached_methods  = try(local.settings["behavior"]["cached_methods"], ["GET", "HEAD"])
  #     compress        = try(local.settings["behavior"]["compress"], true)
  #     default_ttl     = try(local.settings["behavior"]["default_ttl"], 60)
  #     max_ttl         = try(local.settings["behavior"]["max_ttl"], 31536000)
  #     min_ttl         = try(local.settings["behavior"]["min_ttl"], 0)

  #     # forwarded_values:
  #     query_string    = try(local.settings["behavior"]["query_string"], true)
  #     headers         = try(local.settings["behavior"]["headers"], ["Access-Control-Request-Headers", "Access-Control-Request-Method", "Origin"])
  #     cookies_forward = try(local.settings["behavior"]["cookies_forward"], "none")

  #     use_forwarded_values     = false
  #     cache_policy_id          = try(local.settings["behavior"]["cache_policy_id"], "658327ea-f89d-4fab-a63d-7e88639e58f6")
  #     origin_request_policy_id = try(local.settings["behavior"]["origin_request_policy_id"], "b689b0a8-53d0-40ab-baf2-68738e2966ac")

  #     # functions:
  #     lambda_function_association = []
  #     function_association        = []
  #   }
  # ]
}
