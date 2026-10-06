@echo off
REM -------------------------------------------------------
REM Action Guardrail — Windows Deployment Helper
REM Run this from the project root directory
REM -------------------------------------------------------

echo ================================================
echo  Action Guardrail — AWS Deployment (Windows)
echo ================================================
echo.

REM Check AWS CLI
aws --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: AWS CLI not found.
    echo Install from: https://aws.amazon.com/cli/
    pause
    exit /b 1
)

REM Check Docker
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Docker not found.
    echo Install from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

REM Load config
set /p AWS_ACCOUNT_ID=Enter your AWS Account ID (12 digits): 
set /p AWS_REGION=Enter AWS Region (default: us-east-1): 
if "%AWS_REGION%"=="" set AWS_REGION=us-east-1
set /p GROQ_API_KEY=Enter your Groq API Key: 
set /p JWT_SECRET=Enter JWT Secret (or press Enter to generate): 
if "%JWT_SECRET%"=="" (
    for /f %%i in ('python -c "import secrets; print(secrets.token_hex(32))"') do set JWT_SECRET=%%i
)

set APP_NAME=action-guardrail
set ECR_REPO=action-guardrail-backend
set ECS_CLUSTER=action-guardrail-cluster
set ECS_SERVICE=action-guardrail-service
set ECS_TASK=action-guardrail-task
set CONTAINER_PORT=8000
set ECR_URI=%AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com/%ECR_REPO%

echo.
echo ------------------------------------------------
echo  Step 1: Create ECR Repository
echo ------------------------------------------------
aws ecr create-repository --repository-name %ECR_REPO% --region %AWS_REGION% 2>nul
echo ECR Repository ready.

echo.
echo ------------------------------------------------
echo  Step 2: Authenticate Docker with ECR
echo ------------------------------------------------
aws ecr get-login-password --region %AWS_REGION% | docker login --username AWS --password-stdin %AWS_ACCOUNT_ID%.dkr.ecr.%AWS_REGION%.amazonaws.com

echo.
echo ------------------------------------------------
echo  Step 3: Build and Push Docker Image
echo ------------------------------------------------
cd /d "%~dp0.."
docker build --platform linux/amd64 -t %ECR_REPO%:latest .
docker tag %ECR_REPO%:latest %ECR_URI%:latest
docker push %ECR_URI%:latest
echo Docker image pushed to ECR.

echo.
echo ------------------------------------------------
echo  Step 4: Get Default VPC
echo ------------------------------------------------
for /f "tokens=*" %%i in ('aws ec2 describe-vpcs --filters "Name=is-default,Values=true" --query "Vpcs[0].VpcId" --output text --region %AWS_REGION%') do set VPC_ID=%%i
echo VPC: %VPC_ID%

echo.
echo ------------------------------------------------
echo  Step 5: Create ECS Cluster
echo ------------------------------------------------
aws ecs create-cluster --cluster-name %ECS_CLUSTER% --region %AWS_REGION% 2>nul
echo ECS Cluster ready.

echo.
echo ------------------------------------------------
echo  Step 6: Create IAM Role
echo ------------------------------------------------
set ROLE_NAME=action-guardrail-ecs-role
aws iam create-role --role-name %ROLE_NAME% --assume-role-policy-document "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Principal\":{\"Service\":\"ecs-tasks.amazonaws.com\"},\"Action\":\"sts:AssumeRole\"}]}" 2>nul
aws iam attach-role-policy --role-name %ROLE_NAME% --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" 2>nul
echo IAM Role ready.

echo.
echo ================================================
echo  NEXT STEPS (Manual - AWS Console)
echo ================================================
echo.
echo The following steps are easier to complete in
echo the AWS Console at https://console.aws.amazon.com
echo.
echo 1. Go to ECS ^> Task Definitions ^> Create new
echo    - Launch type: FARGATE
echo    - Image URI: %ECR_URI%:latest
echo    - Port: %CONTAINER_PORT%
echo    - Environment variables:
echo      GROQ_API_KEY=%GROQ_API_KEY%
echo      JWT_SECRET=%JWT_SECRET%
echo      DATABASE_URL=sqlite:///./action_guardrail.db
echo.
echo 2. Go to ECS ^> Clusters ^> %ECS_CLUSTER% ^> Create Service
echo    - Task definition: action-guardrail-task
echo    - Desired count: 1
echo    - Add Application Load Balancer
echo.
echo 3. For frontend: Go to S3, create bucket,
echo    upload frontend/dist/ folder,
echo    enable static website hosting
echo.
echo See deploy\README_DEPLOY.md for full details.
echo.
pause
