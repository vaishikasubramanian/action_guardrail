#!/bin/bash
# -------------------------------------------------------
# Step 3: Deploy React frontend to S3 + CloudFront
# -------------------------------------------------------
set -e

source "$(dirname "$0")/config.sh"

echo "================================================"
echo " Action Guardrail — Frontend Deployment"
echo " S3 + CloudFront"
echo "================================================"

# Get backend URL
if [ -f /tmp/alb_url.txt ]; then
    BACKEND_URL=$(cat /tmp/alb_url.txt)
    echo " Using backend URL from ECS deploy: $BACKEND_URL"
else
    echo ""
    read -p "Enter your backend URL (from ecs_deploy.sh output): " BACKEND_URL
fi

echo ""
echo "[1/5] Building React frontend..."
cd "$(dirname "$0")/../frontend"

# Create frontend .env with backend URL
echo "VITE_API_URL=${BACKEND_URL}" > .env

npm install --silent
npm run build

echo "     Build complete: dist/"

# -------------------------------------------------------
# Create S3 bucket
# -------------------------------------------------------
echo ""
echo "[2/5] Creating S3 bucket..."

# Generate unique bucket name
BUCKET_NAME="${APP_NAME}-frontend-$(date +%s | tail -c 8)"

aws s3 mb "s3://${BUCKET_NAME}" \
    --region "$AWS_REGION"

# Configure for static website hosting
aws s3 website "s3://${BUCKET_NAME}" \
    --index-document index.html \
    --error-document index.html

# Set public access
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Set bucket policy for public read
aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy "{
        \"Version\": \"2012-10-17\",
        \"Statement\": [{
            \"Sid\": \"PublicReadGetObject\",
            \"Effect\": \"Allow\",
            \"Principal\": \"*\",
            \"Action\": \"s3:GetObject\",
            \"Resource\": \"arn:aws:s3:::${BUCKET_NAME}/*\"
        }]
    }"

echo "     Bucket: $BUCKET_NAME"

# -------------------------------------------------------
# Upload files to S3
# -------------------------------------------------------
echo ""
echo "[3/5] Uploading files to S3..."

aws s3 sync dist/ "s3://${BUCKET_NAME}" \
    --delete \
    --cache-control "max-age=31536000,public" \
    --region "$AWS_REGION"

# HTML files should not be cached (for SPA routing)
aws s3 cp dist/index.html "s3://${BUCKET_NAME}/index.html" \
    --cache-control "no-cache,no-store,must-revalidate" \
    --content-type "text/html" \
    --region "$AWS_REGION"

echo "     Upload complete."

# -------------------------------------------------------
# Create CloudFront distribution
# -------------------------------------------------------
echo ""
echo "[4/5] Creating CloudFront distribution..."

CF_ORIGIN="${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com"

CF_ID=$(aws cloudfront create-distribution \
    --distribution-config "{
        \"CallerReference\": \"${APP_NAME}-$(date +%s)\",
        \"Comment\": \"Action Guardrail Frontend\",
        \"DefaultRootObject\": \"index.html\",
        \"Origins\": {
            \"Quantity\": 1,
            \"Items\": [{
                \"Id\": \"S3Origin\",
                \"DomainName\": \"${CF_ORIGIN}\",
                \"CustomOriginConfig\": {
                    \"HTTPPort\": 80,
                    \"HTTPSPort\": 443,
                    \"OriginProtocolPolicy\": \"http-only\"
                }
            }]
        },
        \"DefaultCacheBehavior\": {
            \"TargetOriginId\": \"S3Origin\",
            \"ViewerProtocolPolicy\": \"redirect-to-https\",
            \"AllowedMethods\": {
                \"Quantity\": 2,
                \"Items\": [\"GET\",\"HEAD\"]
            },
            \"ForwardedValues\": {
                \"QueryString\": false,
                \"Cookies\": {\"Forward\": \"none\"}
            },
            \"MinTTL\": 0,
            \"DefaultTTL\": 86400,
            \"MaxTTL\": 31536000
        },
        \"CustomErrorResponses\": {
            \"Quantity\": 1,
            \"Items\": [{
                \"ErrorCode\": 404,
                \"ResponsePagePath\": \"/index.html\",
                \"ResponseCode\": \"200\",
                \"ErrorCachingMinTTL\": 0
            }]
        },
        \"PriceClass\": \"PriceClass_100\",
        \"Enabled\": true
    }" \
    --query "Distribution.DomainName" \
    --output text)

echo "     CloudFront domain: $CF_ID"

echo ""
echo "[5/5] Saving deployment info..."
cat > "$(dirname "$0")/deployment_output.txt" << EOF
================================================
 Action Guardrail — Deployment Output
 $(date)
================================================

Backend URL:  ${BACKEND_URL}
Health Check: ${BACKEND_URL}/health
API Docs:     ${BACKEND_URL}/docs

Frontend URL: https://${CF_ID}

S3 Bucket:    ${BUCKET_NAME}

Login credentials:
  Admin:    admin / admin123
  Reviewer: reviewer / reviewer123
  Auditor:  auditor / auditor123
================================================
EOF

cat "$(dirname "$0")/deployment_output.txt"

echo ""
echo "NOTE: CloudFront takes 10-15 minutes to deploy globally."
echo "The frontend will be live at: https://${CF_ID}"
