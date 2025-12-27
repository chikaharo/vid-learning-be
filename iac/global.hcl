locals {
  ## Main vars:
  project_name = get_env("PROJECT_NAME", "huybd-vidlearning")
  main_region  = get_env("MAIN_REGION", "us-east-1") // Main Region of this project
  root_domain  = get_env("ROOT_DOMAIN", "dinhuy.io.vn")

  aws_account_id = get_env("AWS_ID", "468629877310")
  aws_assumed    = get_env("AWS_ASSUMED", false)
  aws_role_name  = get_env("AWS_ROLE_NAME", "AdminAccess")
  # aws_account_ids = split(get_env("AWS_ACCOUNT_IDS", ""), ",")
  aws_account_ids = get_env("AWS_ACCOUNT_IDS")
  prefix          = get_env("ENV", "dev") == "dev" ? "dev" : get_env("ENV", "dev") == "stage" ? "stg" : "prd"

  # White_list Ipsd
  whitelist_ips = {
    # C tower
    "CMC Telecom" = "183.91.3.171/32"
    "FPT Telecom" = "118.70.135.21/32"
    "NetNam-C"    = "101.96.117.124/32"

    # B tower
    "Netnam-B" = "119.17.205.204/32"
    "VNPT"     = "222.252.30.184/32"

    # Japan Office
    "HBLAB JP" = "182.169.71.59/32"

    "GITHub Runner" = "0.0.0.0/0"
  }

  ## Others:
  maintenance_team = get_env("MAINTENANCE_TEAM", "hblab")
  tags = {
    Project   = local.project_name
    ManagedBy = upper(local.maintenance_team)
  }
}
