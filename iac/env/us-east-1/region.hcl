locals {
  aws_region = basename(get_terragrunt_dir()) == "global" ? "us-east-1" : basename(get_terragrunt_dir())
}
