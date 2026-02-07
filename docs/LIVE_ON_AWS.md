# Go Live on AWS (Step-by-Step)

This guide explains the fastest production path for this project using:
- **Frontend**: S3 + CloudFront
- **Backend API**: ECS Fargate + ALB
- **Database**: RDS PostgreSQL
- **Images**: S3
- **Face Auth**: Rekognition

---

## 0) Prerequisites (local)

Install and configure:
- AWS CLI v2 (`aws configure`)
- Docker
- Node.js 20+

Set these environment variables locally (replace values):

```bash
export AWS_REGION=ap-south-1
export AWS_ACCOUNT_ID=123456789012
export PROJECT=pvd-stock
```

---

## 1) Create RDS PostgreSQL

1. In AWS Console → **RDS** → Create database.
2. Engine: PostgreSQL (recommended 15+).
3. Put DB in **private subnets**.
4. Allow inbound only from ECS security group.
5. After creation, note endpoint, db name, username, password.

Run schema:

```bash
psql "host=<RDS_ENDPOINT> port=5432 dbname=pvd_stock user=<DB_USER> password=<DB_PASSWORD> sslmode=require" -f database/schema.sql
```

---

## 2) Create S3 Buckets

Create 2 buckets:
- `pvd-stock-frontend-<env>` (static site assets)
- `pvd-stock-images-<env>` (stock inward/outward images)

Enable:
- Versioning
- Default encryption (SSE-S3 or KMS)
- Block public access on image bucket

---

## 3) Push Backend Image to ECR

Create repository:

```bash
aws ecr create-repository --repository-name ${PROJECT}-backend --region $AWS_REGION
```

Login + build + push:

```bash
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

docker build -t ${PROJECT}-backend:latest ./backend
docker tag ${PROJECT}-backend:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT}-backend:latest
docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${PROJECT}-backend:latest
```

---

## 4) Deploy Backend on ECS Fargate

Create:
1. ECS Cluster (Fargate)
2. Task Definition using image from ECR
3. Service behind Application Load Balancer

Container port: `4000`

Environment variables for task:
- `NODE_ENV=production`
- `PORT=4000`
- `DB_HOST=<RDS_ENDPOINT>`
- `DB_PORT=5432`
- `DB_NAME=pvd_stock`
- `DB_USER=<DB_USER>`
- `DB_PASSWORD=<DB_PASSWORD>` (prefer Secrets Manager)
- `JWT_SECRET=<strong-random-secret>`
- `JWT_EXPIRES_IN=8h`
- `AWS_REGION=<region>`
- `S3_BUCKET_NAME=<pvd-stock-images bucket>`

Health check path: `/health`

---

## 5) IAM Permissions (Task Role)

Attach least-privilege policies to ECS task role:
- S3 access to image bucket (`GetObject`, `PutObject`)
- Rekognition `CompareFaces`
- CloudWatch logs write permissions

---

## 6) Deploy Frontend to S3 + CloudFront

Set production API URL and build:

```bash
cd frontend
VITE_API_BASE_URL=https://<ALB_OR_API_DOMAIN>/api/v1 npm ci
VITE_API_BASE_URL=https://<ALB_OR_API_DOMAIN>/api/v1 npm run build
```

Upload build output:

```bash
aws s3 sync dist/ s3://pvd-stock-frontend-<env>/ --delete
```

Create CloudFront distribution with:
- Origin: frontend S3 bucket
- Default root object: `index.html`
- Custom error response: 403/404 -> `/index.html` (SPA routing)

---

## 7) HTTPS + Domain

1. Request ACM certificate for your domain.
2. Attach cert to CloudFront (frontend).
3. (Optional) Put API behind custom domain/API Gateway or ALB HTTPS listener.
4. Route53 records:
   - `app.yourdomain.com` -> CloudFront
   - `api.yourdomain.com` -> ALB

---

## 8) Create First Admin User (Production)

Exec into backend task/container and run:

```bash
npm run seed:admin -- --email admin@yourdomain.com --name "Super Admin" --password "StrongPass@123"
```

Then log in and enroll face using:
- `POST /api/v1/auth/face/enroll`

---

## 9) Production Security Checklist

- Keep DB private (no public access)
- Use Secrets Manager for DB/JWT secrets
- Enable CloudTrail + GuardDuty
- Enable WAF on CloudFront/ALB
- Add rate limiting for auth routes
- Rotate secrets regularly
- Enable automated RDS backups

---

## 10) Quick Troubleshooting

- **Frontend loads but API fails**: verify `VITE_API_BASE_URL` at build time.
- **502 on ALB**: check ECS task healthy and container port is 4000.
- **DB errors**: verify SG rules between ECS and RDS.
- **Face auth fails**: verify task role has Rekognition permissions and region is correct.
