# Deployment Guide - Secured Voting System

Complete guide for deploying the Secured Voting System to production.

## Table of Contents

1. [Deployment Options](#deployment-options)
2. [Docker Deployment](#docker-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Cloud Deployment](#cloud-deployment)
5. [Monitoring & Logging](#monitoring--logging)
6. [Security Hardening](#security-hardening)
7. [Database Migration](#database-migration)
8. [Rollback Procedures](#rollback-procedures)

## Deployment Options

### Option 1: Docker Compose (Development/Staging)
- Single machine deployment
- Easy to set up
- Good for testing
- Not recommended for production

### Option 2: Kubernetes (Production)
- Scalable architecture
- Container orchestration
- Auto-healing
- Recommended for production

### Option 3: Cloud Platforms (Recommended)
- AWS ECS/EKS
- Azure Container Instances
- Google Cloud Run
- Managed infrastructure

## Docker Deployment

### 1. Prepare Deployment Environment

```bash
# Create deployment directory
mkdir secured-voting-prod
cd secured-voting-prod

# Clone repository
git clone <repository-url>
cd secured-voting-system

# Create production environment file
cp .env.example .env.production
```

### 2. Update Environment Variables

Edit `.env.production`:

```env
# Node Environment
NODE_ENV=production

# Google OAuth (Production credentials)
GOOGLE_CLIENT_ID=your_production_client_id
REACT_APP_GOOGLE_CLIENT_ID=your_production_client_id

# JWT Secret (Generate strong random key)
JWT_SECRET=$(openssl rand -base64 32)

# Ethereum Configuration (Production Network)
ETH_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY
ETH_PRIVATE_KEY=your_mainnet_private_key
VOTING_CONTRACT_ADDRESS=0x...

# Database Configuration (Managed Database)
DATABASE_URL=postgresql://user:password@prod-db.example.com:5432/votingdb

# PostgreSQL (if using container)
POSTGRES_USER=produser
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_DB=votingdb

# SSL/TLS
SSL_ENABLED=true
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

### 3. Build Docker Images

```bash
# Build images without pushing
docker-compose build

# Or build and push to registry
docker build -t your-registry/voting-frontend:latest src/frontend
docker build -t your-registry/voting-backend:latest src/backend
docker build -t your-registry/voting-contracts:latest src/smart_contracts

docker push your-registry/voting-frontend:latest
docker push your-registry/voting-backend:latest
docker push your-registry/voting-contracts:latest
```

### 4. Deploy with Docker Compose

```bash
# Deploy containers
docker-compose -f docker-compose.yml up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3

# Stop services
docker-compose down
```

### 5. Production Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    image: your-registry/voting-backend:latest
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - JWT_SECRET=${JWT_SECRET}
      - ETH_RPC_URL=${ETH_RPC_URL}
      - DATABASE_URL=${DATABASE_URL}
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - db
    networks:
      - app-network
    volumes:
      - ./logs/backend:/app/logs

  frontend:
    image: your-registry/voting-frontend:latest
    ports:
      - "80:80"
    environment:
      - REACT_APP_API_URL=https://api.example.com
      - REACT_APP_GOOGLE_CLIENT_ID=${REACT_APP_GOOGLE_CLIENT_ID}
    restart: always
    depends_on:
      - backend
    networks:
      - app-network

  db:
    image: postgres:14-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  db_data:
    driver: local

networks:
  app-network:
    driver: bridge
```

Deploy production:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Environment Configuration

### Production Environment Variables

```env
# Application
NODE_ENV=production
DEBUG=false

# Google OAuth (Production)
GOOGLE_CLIENT_ID=your_prod_client_id
GOOGLE_CLIENT_SECRET=your_prod_client_secret
REACT_APP_GOOGLE_CLIENT_ID=your_prod_client_id

# JWT
JWT_SECRET=your_strong_secret_key
JWT_EXPIRY=24h

# Ethereum (Mainnet)
ETH_RPC_URL=https://mainnet.infura.io/v3/your_key
ETH_PRIVATE_KEY=your_mainnet_private_key
VOTING_CONTRACT_ADDRESS=0x...contract_address...
NETWORK_ID=1

# Database (Remote/Managed)
DATABASE_URL=postgresql://user:pass@db.example.com:5432/votingdb
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_SSL=true

# API Configuration
API_PORT=5000
API_HOST=0.0.0.0
CORS_ORIGIN=https://voting.example.com
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_REQUESTS=100

# Email (for notifications)
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=your_sendgrid_key
EMAIL_FROM=noreply@voting.example.com

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=your_sentry_dsn

# Security
SSL_ENABLED=true
SSL_CERT=/etc/ssl/certs/cert.pem
SSL_KEY=/etc/ssl/private/key.pem
```

### Secrets Management

Use AWS Secrets Manager, Azure Key Vault, or similar:

```bash
# AWS Example
aws secretsmanager create-secret \
  --name voting-app-secrets \
  --secret-string file://secrets.json

# Retrieve in application
const secret = await secretsManager.getSecretValue({
  SecretId: 'voting-app-secrets'
});
```

## Cloud Deployment

### AWS ECS Deployment

#### 1. Create ECR Repositories

```bash
# Create repositories
aws ecr create-repository --repository-name voting-frontend
aws ecr create-repository --repository-name voting-backend

# Build and push images
docker build -t voting-backend:latest src/backend
docker tag voting-backend:latest <account-id>.dkr.ecr.region.amazonaws.com/voting-backend:latest
docker push <account-id>.dkr.ecr.region.amazonaws.com/voting-backend:latest
```

#### 2. Create ECS Task Definitions

Create `ecs-task-definition.json`:

```json
{
  "family": "voting-system",
  "containerDefinitions": [
    {
      "name": "voting-backend",
      "image": "123456789.dkr.ecr.us-east-1.amazonaws.com/voting-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "hostPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:voting-secrets:JWT_SECRET::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/voting-system",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 3. Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name voting-prod

# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create service
aws ecs create-service \
  --cluster voting-prod \
  --service-name voting-backend \
  --task-definition voting-system \
  --desired-count 2 \
  --launch-type EC2
```

### Azure Container Instances

```bash
# Create resource group
az group create --name voting-prod --location eastus

# Deploy containers
az container create \
  --resource-group voting-prod \
  --name voting-app \
  --image your-registry.azurecr.io/voting-backend:latest \
  --environment-variables \
    NODE_ENV=production \
    DATABASE_URL=$DATABASE_URL
```

## Monitoring & Logging

### 1. Application Monitoring

```javascript
// backend/server.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Log Aggregation

Configure CloudWatch/ELK:

```yaml
# logstash configuration
input {
  docker {
    host => "unix:///var/run/docker.sock"
  }
}

filter {
  if [type] == "docker" {
    json {
      source => "message"
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "voting-logs-%{+YYYY.MM.dd}"
  }
}
```

### 3. Health Checks

```javascript
// backend/routes/health.js
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: checkDatabaseHealth(),
    blockchain: checkBlockchainConnection()
  });
});
```

## Security Hardening

### 1. Environment Security

- Use strong JWT secrets (32+ characters)
- Rotate secrets regularly (every 90 days)
- Store secrets in secure vaults
- Never commit secrets to git

### 2. Network Security

```javascript
// CORS Configuration
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
  maxAge: 3600
}));

// Rate Limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);
```

### 3. Database Security

```sql
-- Create read-only user for application
CREATE USER app_user WITH PASSWORD 'strong_password';
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

-- Enable SSL
ssl = on
ssl_cert_file = '/path/to/cert.pem'
ssl_key_file = '/path/to/key.pem'
```

### 4. Container Security

```dockerfile
# Use specific base image version
FROM node:16.14.2-alpine

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

USER nodejs

# Minimal dependencies
RUN npm ci --only=production
```

## Database Migration

### 1. Pre-deployment Testing

```bash
# Test on staging database
npm run migrate:staging

# Verify data integrity
npm run verify:migrate
```

### 2. Production Migration

```bash
# Create backup
pg_dump -U postgres votingdb > backup-$(date +%Y%m%d).sql

# Run migrations with rollback available
npm run migrate:production

# Verify tables
psql -U postgres -d votingdb -c "\dt"
```

### 3. Rollback Procedure

```bash
# Restore from backup
psql -U postgres votingdb < backup-20240225.sql

# Verify restoration
psql -U postgres -d votingdb -c "\dt"
```

## Rollback Procedures

### Docker Rollback

```bash
# Save current version (before update)
docker save voting-backend:latest > voting-backend-backup.tar

# Deploy new version
docker-compose pull
docker-compose up -d

# If issues, restore previous version
docker load < voting-backend-backup.tar
docker-compose up -d
```

### Database Rollback

```bash
# List backups
aws s3 ls s3://voting-system-backups/

# Restore backup
aws s3 cp s3://voting-system-backups/backup-20240225.sql .
psql -U postgres votingdb < backup-20240225.sql

# Verify
psql -U postgres -d votingdb -c "SELECT COUNT(*) FROM votes;"
```

## Post-Deployment Checklist

- [ ] All services running (`docker-compose ps`)
- [ ] API responding (`curl http://localhost:5000/health`)
- [ ] Frontend accessible (`http://localhost:3000`)
- [ ] Database connected and accessible
- [ ] Environment variables configured
- [ ] Secrets properly managed
- [ ] Monitoring and logging active
- [ ] Backups scheduled
- [ ] SSL certificates valid
- [ ] Rate limiting working
- [ ] CORS configured correctly
- [ ] Blockchain connection verified
- [ ] Smart contract deployed
- [ ] DNS/CDN configured
- [ ] Load balancer configured (if applicable)

## Troubleshooting Deployment

### Services Not Starting

```bash
# Check logs
docker-compose logs backend

# Verify environment variables
docker-compose config

# Check network
docker network ls
docker network inspect voting-prod_app-network
```

### Database Connection Issues

```bash
# Test connection
psql -h localhost -U postgres -d votingdb -c "SELECT 1"

# Check connection string
echo $DATABASE_URL

# Verify credentials
cat .env | grep DATABASE
```

### Poor Performance

```bash
# Check resource usage
docker stats

# Monitor database
psql -U postgres -d votingdb -c "SHOW max_connections;"

# Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM votes WHERE session_id = 1;
```

---

**Last Updated**: February 2026
