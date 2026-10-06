#!/bin/bash
# -------------------------------------------------------
# Step 2: Deploy backend to AWS ECS Fargate with ALB
# -------------------------------------------------------
set -e

source "$(dirname "$0")/config.sh"

echo "================================================"
echo " Action Guardrail — ECS Fargate Deployment"
echo "================================================"

if [ "$AWS_ACCOUNT_ID" = "YOUR_ACCOUNT_ID_HERE" ]; then
    echo "ERROR: Please edit deploy/config.sh and set your AWS_ACCOUNT_ID"
    exit 1
fi

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO}"

# -------------------------------------------------------
# Get default VPC and subnets
# -------------------------------------------------------
echo ""
echo "[1/8] Getting default VPC..."
VPC_ID=$(aws ec2 describe-vpcs \
    --filters "Name=is-default,Values=true" \
    --query "Vpcs[0].VpcId" \
    --output text \
    --region "$AWS_REGION")
echo "     VPC: $VPC_ID"

echo ""
echo "[2/8] Getting subnets..."
SUBNET_IDS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "Subnets[*].SubnetId" \
    --output text \
    --region "$AWS_REGION" | tr '\t' ',')
echo "     Subnets: $SUBNET_IDS"

# -------------------------------------------------------
# Create security groups
# -------------------------------------------------------
echo ""
echo "[3/8] Creating security groups..."

# ALB security group — allow HTTP/HTTPS from internet
ALB_SG_ID=$(aws ec2 create-security-group \
    --group-name "${APP_NAME}-alb-sg" \
    --description "ALB Security Group for ${APP_NAME}" \
    --vpc-id "$VPC_ID" \
    --region "$AWS_REGION" \
    --query "GroupId" \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${APP_NAME}-alb-sg" \
    --query "SecurityGroups[0].GroupId" \
    --output text \
    --region "$AWS_REGION")

aws ec2 authorize-security-group-ingress \
    --group-id "$ALB_SG_ID" \
    --protocol tcp --port 80 --cidr 0.0.0.0/0 \
    --region "$AWS_REGION" 2>/dev/null || true

aws ec2 authorize-security-group-ingress \
    --group-id "$ALB_SG_ID" \
    --protocol tcp --port 443 --cidr 0.0.0.0/0 \
    --region "$AWS_REGION" 2>/dev/null || true

# ECS security group — allow traffic from ALB
ECS_SG_ID=$(aws ec2 create-security-group \
    --group-name "${APP_NAME}-ecs-sg" \
    --description "ECS Security Group for ${APP_NAME}" \
    --vpc-id "$VPC_ID" \
    --region "$AWS_REGION" \
    --query "GroupId" \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${APP_NAME}-ecs-sg" \
    --query "SecurityGroups[0].GroupId" \
    --output text \
    --region "$AWS_REGION")

aws ec2 authorize-security-group-ingress \
    --group-id "$ECS_SG_ID" \
    --protocol tcp --port "$CONTAINER_PORT" \
    --source-group "$ALB_SG_ID" \
    --region "$AWS_REGION" 2>/dev/null || true

echo "     ALB SG: $ALB_SG_ID | ECS SG: $ECS_SG_ID"

# -------------------------------------------------------
# Create ECS cluster
# -------------------------------------------------------
echo ""
echo "[4/8] Creating ECS cluster..."
aws ecs create-cluster \
    --cluster-name "$ECS_CLUSTER" \
    --region "$AWS_REGION" 2>/dev/null || true
echo "     Cluster: $ECS_CLUSTER"

# -------------------------------------------------------
# Create IAM role for ECS task execution
# -------------------------------------------------------
echo ""
echo "[5/8] Creating IAM execution role..."
ROLE_NAME="${APP_NAME}-ecs-role"

aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{
        "Version":"2012-10-17",
        "Statement":[{
            "Effect":"Allow",
            "Principal":{"Service":"ecs-tasks.amazonaws.com"},
            "Action":"sts:AssumeRole"
        }]
    }' \
    --region "$AWS_REGION" 2>/dev/null || true

aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" \
    2>/dev/null || true

ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/${ROLE_NAME}"
echo "     Role ARN: $ROLE_ARN"

# -------------------------------------------------------
# Register ECS task definition
# -------------------------------------------------------
echo ""
echo "[6/8] Registering ECS task definition..."

# Create CloudWatch log group
aws logs create-log-group \
    --log-group-name "/ecs/${APP_NAME}" \
    --region "$AWS_REGION" 2>/dev/null || true

cat > /tmp/task-definition.json << EOF
{
    "family": "${ECS_TASK}",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "512",
    "memory": "1024",
    "executionRoleArn": "${ROLE_ARN}",
    "containerDefinitions": [
        {
            "name": "${APP_NAME}",
            "image": "${ECR_URI}:latest",
            "portMappings": [
                {
                    "containerPort": ${CONTAINER_PORT},
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {"name": "GROQ_API_KEY", "value": "${GROQ_API_KEY}"},
                {"name": "JWT_SECRET", "value": "${JWT_SECRET}"},
                {"name": "DATABASE_URL", "value": "sqlite:///./action_guardrail.db"}
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/${APP_NAME}",
                    "awslogs-region": "${AWS_REGION}",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://localhost:${CONTAINER_PORT}/health || exit 1"],
                "interval": 30,
                "timeout": 10,
                "retries": 3,
                "startPeriod": 15
            }
        }
    ]
}
EOF

aws ecs register-task-definition \
    --cli-input-json file:///tmp/task-definition.json \
    --region "$AWS_REGION" > /dev/null
echo "     Task definition registered: $ECS_TASK"

# -------------------------------------------------------
# Create Application Load Balancer
# -------------------------------------------------------
echo ""
echo "[7/8] Creating Application Load Balancer..."

SUBNET_ARRAY=$(echo "$SUBNET_IDS" | tr ',' ' ')

ALB_ARN=$(aws elbv2 create-load-balancer \
    --name "${APP_NAME}-alb" \
    --subnets $SUBNET_ARRAY \
    --security-groups "$ALB_SG_ID" \
    --region "$AWS_REGION" \
    --query "LoadBalancers[0].LoadBalancerArn" \
    --output text 2>/dev/null || \
    aws elbv2 describe-load-balancers \
    --names "${APP_NAME}-alb" \
    --query "LoadBalancers[0].LoadBalancerArn" \
    --output text \
    --region "$AWS_REGION")

ALB_DNS=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns "$ALB_ARN" \
    --query "LoadBalancers[0].DNSName" \
    --output text \
    --region "$AWS_REGION")

# Target group
TG_ARN=$(aws elbv2 create-target-group \
    --name "${APP_NAME}-tg" \
    --protocol HTTP \
    --port "$CONTAINER_PORT" \
    --vpc-id "$VPC_ID" \
    --target-type ip \
    --health-check-path "/health" \
    --health-check-interval-seconds 30 \
    --healthy-threshold-count 2 \
    --region "$AWS_REGION" \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text 2>/dev/null || \
    aws elbv2 describe-target-groups \
    --names "${APP_NAME}-tg" \
    --query "TargetGroups[0].TargetGroupArn" \
    --output text \
    --region "$AWS_REGION")

# Listener
aws elbv2 create-listener \
    --load-balancer-arn "$ALB_ARN" \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn="$TG_ARN" \
    --region "$AWS_REGION" 2>/dev/null || true

echo "     ALB DNS: http://$ALB_DNS"

# -------------------------------------------------------
# Create ECS Service
# -------------------------------------------------------
echo ""
echo "[8/8] Creating ECS service..."

SUBNET_JSON=$(echo "$SUBNET_IDS" | python3 -c "import sys; s=sys.stdin.read().strip(); print(','.join(['\"'+x+'\"' for x in s.split(',')]))")

aws ecs create-service \
    --cluster "$ECS_CLUSTER" \
    --service-name "$ECS_SERVICE" \
    --task-definition "$ECS_TASK" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${SUBNET_JSON}],securityGroups=[\"${ECS_SG_ID}\"],assignPublicIp=ENABLED}" \
    --load-balancers "targetGroupArn=${TG_ARN},containerName=${APP_NAME},containerPort=${CONTAINER_PORT}" \
    --region "$AWS_REGION" 2>/dev/null || \
aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --task-definition "$ECS_TASK" \
    --region "$AWS_REGION" > /dev/null

echo ""
echo "================================================"
echo " SUCCESS: Backend deployed to ECS Fargate"
echo ""
echo " Backend URL: http://${ALB_DNS}"
echo " Health Check: http://${ALB_DNS}/health"
echo " API Docs: http://${ALB_DNS}/docs"
echo ""
echo " NOTE: It takes 2-3 minutes for the service"
echo " to become healthy. Run this to check:"
echo " aws ecs describe-services --cluster ${ECS_CLUSTER} --services ${ECS_SERVICE} --region ${AWS_REGION}"
echo "================================================"
echo ""
echo "IMPORTANT: Copy this URL: http://${ALB_DNS}"
echo "You need it for the frontend deploy script."
echo ""

# Save ALB URL for frontend script
echo "http://${ALB_DNS}" > /tmp/alb_url.txt
echo "Next step: Run ./deploy/frontend_deploy.sh"
