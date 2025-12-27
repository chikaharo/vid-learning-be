locals {
  global_vars = read_terragrunt_config(find_in_parent_folders("global.hcl", "./global.hcl"), { locals = {} }).locals

  domain_name = "${local.global_vars.root_domain}"
  ## VPC:
  vpc_settings = {
    cidr                         = "10.30.0.0/16"
    cidr_newbits                 = 4
    enable_ipv6                  = false
    enable_nat_gateway           = false
    single_nat_gateway           = true
    map_public_ip_on_launch      = false
    enable_dns_support           = true
    enable_dns_hostnames         = true
    enable_vpn_gateway           = false
    create_database_subnet_group = false
    enable_dhcp_options          = true
    vpc_path                     = "${dirname(find_in_parent_folders("root.hcl"))}/env/${local.global_vars.main_region}/vpc"
  }

  ## EC2:
  ec2_settings = {
    vid-learning = {
      ami           = "ami-068c0051b15cdb816"
      instance_type = "t3.small"
      eip           = true
      volume_size = 20
    }
  }

  ## ACM:
  acm_settings = {
  }

  ## Route53:
  route53_settings = {
    domain_name    = local.global_vars.root_domain
    create_records = true
    records = [
    ]
  }

  ## API Gateway:
  agw_settings = {
  }

  ## ALB:
  alb_settings = {
    deletion_protection = false
    in_private_subnet   = true
  }

  ## CloudFront:
  cf_settings = {
    create_vpc_origin = true
  }

  ## S3:
  s3_settings = {
    no_prefix = false
  }

  ## Securfity group settings
  sg_settings = {
  }

  ## RDS:
  aurora_settings = {
    # instance_count      = 1
    master_username     = "postgres"
    engine              = "aurora-postgresql"
    engine_version      = "17.0"
    storage_encrypted   = true
    deletion_protection = false
  }

  ## Lambda
  lambda_settings = {
    account-service = {
      # function_name = "test-fucntion-account"
      in_private_subnet = true
    }

    products-service = {
    }

    process-order = {
    }

    process-payment = {
    }
    default = {
      function_name = "test-default-function"
    }
  }

  ## ECR
  ecr_settings = {
  }

  ## ECS
  ecs_settings = {
    launch_type                    = "FARGATE"
    propagate_tags                 = "SERVICE"
    ignore_changes_task_definition = false
    assign_public_ip               = true

    orders-service = {
      ## service:
      launch_type               = "FARGATE"
      network_mode              = "awsvpc"
      port                      = 3000
      enable_cloudwatch_logging = false
      task_memory               = 512
      task_cpu                  = 256
      enabled_schedule          = true
    }
  }

  cloudtrail_settings = {
    namespace = "default"
    enabled   = false
  }

  ## SQS
  sqs_settings = {
    fifo_queue = true
    create_dlq = true
  }

  ## SNS
  sns_settings = {
    create = true
    # email_endpoint = "infra@hblab.vn"
    topics = {
      first = {
        name = "default sns topic"
        subscriptions = {
          first = {
            protocol = "email"
            endpoint = "infra@hblab.vn"
          }
        }
      }
      huybd = {
        name = "huybd sns topic"
        subscriptions = {
          first = {
            protocol = "email"
            endpoint = "huybd@hblab.vn"
          }
        }
      }
    }
  }
}
