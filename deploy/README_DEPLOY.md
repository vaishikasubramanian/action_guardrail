# AWS Deployment Guide — Action Guardrail

## Architecture

```
Internet
    │
    ▼
CloudFront (React Frontend — S3)
    │
    ▼
Application Load Balancer (HTTPS)
    │
    ▼
ECS Fargate (FastAPI Backend)
    │
    ▼
SQLite on EFS (persistent storage)
```

## Prerequisites

1. AWS account created
2. AWS CLI installed and configured (`aws configure`)
3. Docker installed and running
4. Node.js 18+ installed

## Step-by-Step Deployment

### Step 1 — Configure AWS CLI

```bash
aws configure
```

Enter:
- AWS Access Key ID
- AWS Secret Access Key  
- Default region: `us-east-1`
- Default output format: `json`

Verify it works:
```bash
aws sts get-caller-identity
```

### Step 2 — Set your configuration

Edit `deploy/config.sh` with your values:
```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=your-12-digit-account-id
APP_NAME=action-guardrail
```

### Step 3 — Deploy backend to ECS

```bash
chmod +x deploy/ecr_push.sh
./deploy/ecr_push.sh

chmod +x deploy/ecs_deploy.sh
./deploy/ecs_deploy.sh
```

This will:
1. Create ECR repository
2. Build and push Docker image
3. Create ECS cluster
4. Create task definition
5. Create ECS service
6. Create Application Load Balancer
7. Output your public backend URL

### Step 4 — Deploy frontend to S3 + CloudFront

```bash
chmod +x deploy/frontend_deploy.sh
./deploy/frontend_deploy.sh
```

This will:
1. Create S3 bucket
2. Build React app with your backend URL
3. Upload to S3
4. Create CloudFront distribution
5. Output your public frontend URL

### Step 5 — Update environment

After deployment, update your `.env`:
```
GROQ_API_KEY=your_actual_key
JWT_SECRET=your_random_secret
DATABASE_URL=sqlite:///./action_guardrail.db
ALLOWED_ORIGINS=https://your-cloudfront-url.cloudfront.net
```

## Estimated Costs (AWS Free Tier)

| Service | Free Tier | Cost After |
|---|---|---|
| ECS Fargate | 750 hrs/month | ~$0.01/hr |
| ECR | 500MB storage | ~$0.10/GB |
| ALB | 750 hrs/month | ~$0.008/hr |
| S3 | 5GB storage | ~$0.023/GB |
| CloudFront | 1TB data | ~$0.0085/GB |

**Estimated total for demo: ~$0-5/month** (well within free tier)

## Teardown (Stop Billing)

```bash
chmod +x deploy/teardown.sh
./deploy/teardown.sh
```
