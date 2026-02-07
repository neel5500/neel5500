# AWS Deployment (Production)

## Reference Architecture
- **Frontend**: S3 + CloudFront (or Amplify Hosting)
- **Backend API**: ECS Fargate (or Elastic Beanstalk / EKS)
- **Database**: Amazon RDS PostgreSQL (private subnets)
- **Images**: S3 bucket with pre-signed upload URLs
- **Face Auth**: AWS Rekognition (CompareFaces)
- **Secrets**: AWS Secrets Manager / SSM Parameter Store
- **Observability**: CloudWatch Logs + alarms
- **Security**: WAF + Shield + ACM TLS cert + IAM least privilege

## Steps
1. Provision VPC with public + private subnets in 2 AZs.
2. Deploy RDS PostgreSQL in private subnet; apply schema from `database/schema.sql`.
3. Create S3 buckets:
   - `pvd-stock-frontend`
   - `pvd-stock-images`
4. Build backend Docker image and push to ECR.
5. Deploy backend service on ECS Fargate behind Application Load Balancer.
6. Configure task role IAM policies:
   - S3 PutObject/GetObject for image bucket only
   - Rekognition CompareFaces permissions
   - CloudWatch logs write
7. Configure environment vars and secrets (JWT secret, DB credentials).
8. Deploy frontend to S3 + CloudFront and set `VITE_API_BASE_URL` to API domain.
9. Enable CloudWatch alarms (5xx spikes, CPU, memory, DB connections).
10. Enable automated RDS snapshots and S3 lifecycle rules.

## Hardening Checklist
- Enforce HTTPS only.
- Rotate JWT secret and DB passwords.
- Enable AWS Config and GuardDuty.
- Restrict security groups to least access.
- Enable DB SSL and encryption at rest.
- Enable CloudTrail for auditability.
