#!/bin/bash
# -------------------------------------------------------
# TEARDOWN — Delete all AWS resources to stop billing
# WARNING: This is irreversible
# -------------------------------------------------------
set -e

source "$(dirname "$0")/config.sh"

echo "================================================"
echo " Action Guardrail — AWS Teardown"
echo " WARNING: This will delete all resources!"
echo "================================================"
read -p "Are you sure? Type 'yes' to confirm: " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "Deleting ECS service..."
aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --desired-count 0 \
    --region "$AWS_REGION" 2>/dev/null || true

aws ecs delete-service \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --region "$AWS_REGION" 2>/dev/null || true

echo "Deleting ECS cluster..."
aws ecs delete-cluster \
    --cluster "$ECS_CLUSTER" \
    --region "$AWS_REGION" 2>/dev/null || true

echo "Deleting ALB..."
ALB_ARN=$(aws elbv2 describe-load-balancers \
    --names "${APP_NAME}-alb" \
    --query "LoadBalancers[0].LoadBalancerArn" \
    --output text \
    --region "$AWS_REGION" 2>/dev/null || echo "")
if [ -n "$ALB_ARN" ] && [ "$ALB_ARN" != "None" ]; then
    aws elbv2 delete-load-balancer \
        --load-balancer-arn "$ALB_ARN" \
        --region "$AWS_REGION" 2>/dev/null || true
fi

echo "Deleting ECR repository..."
aws ecr delete-repository \
    --repository-name "$ECR_REPO" \
    --force \
    --region "$AWS_REGION" 2>/dev/null || true

echo ""
echo "================================================"
echo " Teardown complete. All resources deleted."
echo " Check AWS Console to confirm."
echo "================================================"
