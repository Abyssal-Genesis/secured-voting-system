# Cloud Deployment Guide - Secured Voting System Frontend

## 🚀 Deployment Overview

This guide provides comprehensive instructions for deploying the Secured Voting System frontend to various cloud platforms including Azure, AWS, Vercel, Netlify, and traditional hosting.

---

## 📊 Deployment Options Comparison

| Platform | Cost | Ease | Scalability | Recommended | Setup Time |
|----------|------|------|-------------|-------------|-----------|
| **Vercel** | Free/Pro | Very Easy | Excellent | ⭐⭐⭐⭐⭐ | 5 min |
| **Netlify** | Free/Pro | Very Easy | Excellent | ⭐⭐⭐⭐⭐ | 5 min |
| **Azure** | Varies | Medium | Excellent | ⭐⭐⭐⭐ | 15 min |
| **AWS S3+CloudFront** | Low | Medium | Excellent | ⭐⭐⭐⭐ | 20 min |
| **Docker** | Varies | Medium | Excellent | ⭐⭐⭐ | 10 min |
| **Traditional Host** | Low | Hard | Limited | ⭐⭐ | 30 min |

---

## 🟢 Option 1: Vercel Deployment (Recommended - Easiest)

### Overview
- **Cost**: Free tier available, Pro from $20/month
- **Deployment Time**: < 5 minutes
- **Auto-scaling**: Yes
- **SSL**: Automatic

### Prerequisites
- Vercel account (free signup at vercel.com)
- GitHub account (or GitLab/Bitbucket)
- Deployed repository

### Step-by-Step Setup

#### 1. Push Code to GitHub
```bash
cd secured-voting-system
git init
git add .
git commit -m "Initial commit: Secured Voting System"
git remote add origin https://github.com/YOUR_USERNAME/secured-voting-system.git
git branch -M main
git push -u origin main
```

#### 2. Create Vercel Account
- Visit https://vercel.com
- Sign up with GitHub
- Authorize Vercel to access repositories

#### 3. Deploy Project
```bash
# Option A: Via CLI
npm i -g vercel
cd src/frontend
vercel

# Option B: Via Dashboard
# Go to vercel.com/new
# Import GitHub repository
# Select 'src/frontend' as root directory
# Configure environment variables
```

#### 4. Configure Environment Variables
```bash
# In Vercel Dashboard → Settings → Environment Variables
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_WEB3_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_CHAIN_ID=1
REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

#### 5. Configure Redirects
Create `vercel.json`:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "env": {
    "REACT_APP_API_URL": "@react_app_api_url",
    "REACT_APP_WEB3_RPC_URL": "@react_app_web3_rpc_url",
    "REACT_APP_CONTRACT_ADDRESS": "@react_app_contract_address"
  },
  "routes": [
    {
      "src": "^/api/(.*)",
      "dest": "https://api.your-domain.com/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Deployment Verification
```bash
# Check deployment status
vercel status

# View logs
vercel logs

# Redeploy if needed
vercel --prod
```

### Custom Domain Setup
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. SSL certificate auto-provisioned

---

## 🟢 Option 2: Netlify Deployment (Easiest Alternative)

### Overview
- **Cost**: Free tier available, Pro from $19/month
- **Deployment Time**: < 5 minutes
- **Auto-scaling**: Yes
- **Features**: In-built analytics, forms, functions

### Step-by-Step Setup

#### 1. Connect Repository
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Push to GitHub first
git push origin main
```

#### 2. Deploy via Web Interface
- Visit https://app.netlify.com
- Click "New site from Git"
- Select GitHub, authorize
- Choose repository
- Set build settings:
  - **Base directory**: `src/frontend`
  - **Build command**: `npm run build`
  - **Publish directory**: `build`

#### 3. Configure Environment Variables
```bash
# In Netlify UI:
Site settings → Build & deploy → Environment
- REACT_APP_API_URL=https://api.your-domain.com
- REACT_APP_WEB3_RPC_URL=https://mainnet.infura.io/v3/KEY
- REACT_APP_CONTRACT_ADDRESS=0x...
- REACT_APP_CHAIN_ID=1
```

#### 4. Configure Redirects
Create `src/frontend/public/_redirects`:
```
/*    /index.html   200
/api/*  https://api.your-domain.com/:splat  200
```

#### 5. Deploy CLI Method
```bash
# Navigate to frontend
cd src/frontend

# Deploy
netlify deploy --prod

# Monitor deployment
netlify watch
```

### Custom Domain
1. Domain settings → Add custom domain
2. Follow DNS instructions
3. SSL auto-provisioned

---

## 🔵 Option 3: Azure Static Web Apps

### Overview
- **Cost**: Free tier included, $1+ for custom domains
- **Deployment Time**: 5-10 minutes
- **Integration**: Full Azure ecosystem
- **CI/CD**: Automatic with GitHub

### Prerequisites
- Azure account (free signup)
- GitHub repository

### Step-by-Step Setup

#### 1. Create Static Web App
```bash
# Via Azure CLI
az login
az group create --name voting-system-rg --location eastus

az staticwebapp create \
  --name voting-system-frontend \
  --resource-group voting-system-rg \
  --source https://github.com/YOUR_USERNAME/secured-voting-system \
  --branch main \
  --location eastus \
  --app-location "src/frontend" \
  --output-location "build"
```

#### 2. Configure GitHub Action
Azure automatically creates `.github/workflows/azure-static-web-apps-deployment.yml`:

```yaml
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - main
    paths:
      - 'src/frontend/**'
  pull_request:
    branches:
      - main

jobs:
  build_and_deploy_job:
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3

      - name: Build
        run: |
          cd src/frontend
          npm ci
          npm run build

      - name: Deploy to Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_TOKEN }}
          repo_token: ${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "src/frontend"
          output_location: "build"
```

#### 3. Configure Environment Variables
Azure Portal → Static Web App → Settings → Configuration:
```
REACT_APP_API_URL=https://api.voting-system.azure.com
REACT_APP_WEB3_RPC_URL=https://mainnet.infura.io/v3/KEY
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_CHAIN_ID=1
```

#### 4. Configure Routing
Create `src/frontend/staticwebapp.config.json`:
```json
{
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "mimeTypes": {
    ".woff": "font/woff",
    ".woff2": "font/woff2"
  },
  "routes": [
    {
      "route": "/api/*",
      "rewrite": "https://api.voting-system.azure.com/*"
    }
  ]
}
```

### Custom Domain
1. Custom domains → Add
2. Add DNS CNAME record
3. SSL auto-provisioned

---

## 🟠 Option 4: AWS S3 + CloudFront

### Overview
- **Cost**: Minimal (~$0-5/month for low traffic)
- **Deployment Time**: 10-15 minutes
- **Performance**: Global CDN
- **Scalability**: Unlimited

### Prerequisites
- AWS account
- AWS CLI installed and configured

### Step-by-Step Setup

#### 1. Create S3 Bucket
```bash
# Create bucket
aws s3 mb s3://voting-system-frontend-prod --region us-east-1

# Enable static website hosting
aws s3api put-bucket-website \
  --bucket voting-system-frontend-prod \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "index.html"}
  }'

# Block public access (use CloudFront instead)
aws s3api put-bucket-public-access-block \
  --bucket voting-system-frontend-prod \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
```

#### 2. Build and Deploy
```bash
cd src/frontend

# Build production
npm run build

# Sync to S3
aws s3 sync build/ s3://voting-system-frontend-prod/

# Set cache headers
aws s3 cp build/ s3://voting-system-frontend-prod/ \
  --recursive \
  --exclude "*.js" \
  --exclude "*.css" \
  --cache-control "max-age=604800"

# Don't cache index.html
aws s3 cp build/index.html s3://voting-system-frontend-prod/ \
  --cache-control "max-age=3600"
```

#### 3. Create CloudFront Distribution
```bash
# Create OAI (Origin Access Identity)
aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
  CallerReference=$(date +%s)

# Create distribution (via console or CLI)
# Origin: S3 bucket
# Origin path: / (empty)
# Compress objects: Yes
# Viewer protocol policy: Redirect HTTP to HTTPS
# Allowed HTTP methods: GET, HEAD
# Query strings: Yes
# Caching: 
#   Default TTL: 86400
#   Max TTL: 31536000
# Cache behaviors:
#   index.html: 300s
#   *.js/*.css: 31536000s
```

#### 4. Configure Error Pages
```bash
# In CloudFront distribution:
# Error Handling
# 403 → /index.html (200)
# 404 → /index.html (200)
```

#### 5. Environment Setup Script
Create `deploy.sh`:
```bash
#!/bin/bash
set -e

echo "Building frontend..."
cd src/frontend
npm run build
cd ../..

BUCKET_NAME="voting-system-frontend-prod"
DISTRIBUTION_ID="E123ABC456"

echo "Syncing build to S3..."
aws s3 sync src/frontend/build/ s3://${BUCKET_NAME}/ \
  --delete \
  --cache-control "public, max-age=3600"

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*"

echo "Deployment complete!"
```

---

## 🐳 Option 5: Docker Containerization

### Overview
- **Cost**: Host-dependent
- **Deployment Time**: 10-20 minutes
- **Flexibility**: Deploy anywhere (AWS ECS, Azure Container, Heroku)
- **Consistency**: Same environment everywhere

### Dockerfile
```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && \
    npm cache clean --force

COPY . .

RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to serve static files
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/build ./build

# Copy package.json for serve
COPY --from=builder /app/package.json ./

EXPOSE 3000

ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["serve", "-s", "build", "-l", "3000"]
```

### Docker Compose
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=${API_URL:-http://localhost:5000}
      - REACT_APP_WEB3_RPC_URL=${WEB3_RPC_URL}
      - REACT_APP_CONTRACT_ADDRESS=${CONTRACT_ADDRESS}
      - REACT_APP_CHAIN_ID=${CHAIN_ID:-1}
      - REACT_APP_GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
    restart: unless-stopped
    networks:
      - voting-network

  # Backend service
  backend:
    build:
      context: ../backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
    networks:
      - voting-network

networks:
  voting-network:
    driver: bridge
```

### Build and Run
```bash
# Build image
docker build -t voting-system-frontend:1.0 .

# Run container
docker run -d \
  --name voting-frontend \
  -p 3000:3000 \
  -e REACT_APP_API_URL=https://api.your-domain.com \
  -e REACT_APP_WEB3_RPC_URL=https://mainnet.infura.io/v3/KEY \
  voting-system-frontend:1.0

# Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f frontend
```

### Deploy to AWS ECS
```bash
# Create ECR repository
aws ecr create-repository --repository-name voting-system-frontend

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag voting-system-frontend:1.0 \
  123456789.dkr.ecr.us-east-1.amazonaws.com/voting-system-frontend:1.0

# Push to ECR
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/voting-system-frontend:1.0

# Create ECS service and task definition
# (Use AWS Console or AWS CLI)
```

---

## 🌐 Environment Configuration

### Required Environment Variables
```bash
# API Configuration
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_API_TIMEOUT=30000

# Blockchain Configuration
REACT_APP_WEB3_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_CHAIN_ID=1

# OAuth Configuration
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Optional Features
REACT_APP_SENTRY_DSN=
REACT_APP_ANALYTICS_ID=
REACT_APP_ENVIRONMENT=production
```

### Environment-Specific Files
```
.env              # Default/development
.env.local        # Local overrides (git ignored)
.env.production   # Production-only
.env.staging      # Staging environment
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Environment variables secured (never commit secrets)
- [ ] HTTPS/SSL enabled
- [ ] CORS configured with specific origins
- [ ] Security headers set:
  ```
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Strict-Transport-Security: max-age=31536000
  Content-Security-Policy: default-src 'self'
  ```
- [ ] API rate limiting configured
- [ ] CSRF protection enabled
- [ ] Sensitive data not logged
- [ ] Third-party scripts reviewed
- [ ] Dependency vulnerabilities checked
- [ ] Code obfuscation enabled
- [ ] Source maps disabled in production

---

## 📊 Performance Optimization

### Build Optimization
```json
{
  "scripts": {
    "build": "react-scripts build && npm run analyze",
    "analyze": "source-map-explorer 'build/static/js/*.js'"
  }
}
```

### Monitoring & Metrics
```bash
# Performance monitoring
npm install --save-dev lighthouse

# Run Lighthouse audit
lighthouse https://your-domain.com --view

# Check bundle size
npm install --save-dev bundlesize
```

### Caching Strategy
- Static assets: 1 year cache (with fingerprinting)
- JavaScript: 1 month cache
- CSS: 1 month cache
- HTML: No cache (or short - 1 hour)
- Images: 1 month cache

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
    paths:
      - 'src/frontend/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        working-directory: src/frontend
      
      - name: Run tests
        run: npm test
        working-directory: src/frontend
      
      - name: Lint code
        run: npm run lint
        working-directory: src/frontend
      
      - name: Build
        run: npm run build
        working-directory: src/frontend
      
      - name: Deploy
        # Run: vercel --prod or netlify deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: npm i -g vercel && vercel --prod --token $VERCEL_TOKEN
```

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 16+
```

### Deployment Fails
```bash
# Check build output
npm run build --verbose

# Verify environment variables
echo $REACT_APP_API_URL

# Check logs
vercel logs production
# or
netlify logs
```

### Performance Issues
```bash
# Analyze bundle
npm run analyze

# Check network requests
# DevTools → Network → Performance
```

### CORS Issues
- Verify backend CORS configuration
- Check API URL in environment variables
- Ensure backend is running and accessible

---

## 📈 Monitoring & Maintenance

### Setup Monitoring
```bash
# Sentry for error tracking
npm install --save @sentry/react

# Google Analytics
npm install --save react-ga4

# Datadog/New Relic for performance
```

### Regular Maintenance
- [ ] Update dependencies monthly
- [ ] Monitor error logs daily
- [ ] Check performance metrics weekly
- [ ] Review security advisories
- [ ] Test all features
- [ ] Update documentation

---

## 🎯 Scaling Strategy

### Horizontal Scaling
- Use CDN for asset delivery
- Multiple backend API instances
- Database replication
- Redis cache layer

### Vertical Scaling
- Increase server resources
- Optimize database queries
- Implement caching
- Use compression (gzip, brotli)

---

## 📞 Support

For deployment issues:
1. Check platform-specific documentation
2. Review build logs
3. Verify environment variables
4. Test locally before deploying
5. Contact platform support

---

## 🎓 Resources

- [Vercel Deployment Guide](https://vercel.com/docs)
- [Netlify Deploy Guide](https://docs.netlify.com)
- [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)
- [AWS S3 Static Websites](https://docs.aws.amazon.com/s3/)
- [Docker Best Practices](https://docs.docker.com)
- [React Deployment](https://create-react-app.dev/deployment/)

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Status**: Production Ready ✅
