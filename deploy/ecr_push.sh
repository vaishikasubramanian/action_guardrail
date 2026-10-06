#!/bin/bash
# -------------------------------------------------------
# Step 1: Build Docker image and push to AWS ECR
# -------------------------------------------------------
set -e

# Load config
source "$(dirname "$0")/config.sh"

echo "================================================"
echo " Action Guardrail — ECR Push"
echo " Region: $AWS_REGION"
echo " Account: $AWS_ACCOUNT_ID"
echo "================================================"

# Validate config
if [ "$AWS_ACCOUNT_ID" = "YOUR_ACCOUNT_ID_HERE" ]; then
    echo "ERROR: Please edit deploy/config.sh and set your AWS_ACCOUNT_ID"
    exit 1
fi

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

echo ""
echo "[1/4] Creating ECR repository (if not exists)..."
aws ecr describe-repositories \
    --repository-names "$ECR_REPO" \
    --region "$AWS_REGION" 2>/dev/null || \
aws ecr create-repository \
    --repository-name "$ECR_REPO" \
    --region "$AWS_REGION" \
    --image-scanning-configuration scanOnPush=true
echo "     ECR repository ready: $ECR_URI"

echo ""
echo "[2/4] Authenticating Docker with ECR..."
aws ecr get-login-password \
    --region "$AWS_REGION" | \
docker login \
    --username AWS \
    --password-stdin \
    "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo ""
echo "[3/4] Building Docker image..."
# Go to project root
cd "$(dirname "$0")/.."

docker build \
    --platform linux/amd64 \
    -t "${ECR_REPO}:latest" \
    .

echo ""
echo "[4/4] Pushing image to ECR..."
docker tag "${ECR_REPO}:latest" "${ECR_URI}:latest"
docker push "${ECR_URI}:latest"

echo ""
echo "================================================"
echo " SUCCESS: Image pushed to ECR"
echo " URI: ${ECR_URI}:latest"
echo "================================================"
echo ""
echo "Next step: Run ./deploy/ecs_deploy.sh"
