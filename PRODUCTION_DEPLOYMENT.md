# Production Deployment Guide

## System Requirements

### Hardware
- **CPU**: 2+ cores (4+ recommended)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Storage**: 20GB + for blockchain data
- **Network**: Stable internet connection, 100 Mbps+

### Software
- **Docker**: v20.10+
- **Docker Compose**: v2.0+
- **Node.js**: v18.0+
- **PostgreSQL**: v13+
- **Redis**: v6.0+

---

## Pre-Deployment Checklist

- [ ] Database credentials secured and randomized
- [ ] SSL/TLS certificates obtained
- [ ] Environment variables configured
- [ ] Blockchain contract deployed
- [ ] OAuth credentials configured
- [ ] Backup strategy implemented
- [ ] Monitoring tools configured
- [ ] Load balancer configured (if needed)
- [ ] CDN configured (if needed)
- [ ] Firewall rules configured

---

## Environment Setup

### 1. Create `.env.production` file

```bash
# Copy example and customize
cp .env.example .env.production

# Set production values
NODE_ENV=production
JWT_SECRET=<generate-secure-random-string>
GOOGLE_CLIENT_ID=<your-google-client-id>
# ... etc
```

### 2. Generate SSL Certificates

```bash
# Using Let's Encrypt with Certbot
docker run --rm -v $(pwd)/certs:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d yourdomain.com \
  -d www.yourdomain.com
```

### 3. Initialize Database

```bash
# Start PostgreSQL container
docker-compose -f docker-compose-prod.yml up -d postgres

# Run migrations
docker-compose -f docker-compose-prod.yml exec backend \
  npm run migrate:up
```

---

## Deployment Steps

### 1. Build Docker Images

```bash
# Build all services
docker-compose -f docker-compose-prod.yml build

# Or build specific service
docker-compose -f docker-compose-prod.yml build backend
```

### 2. Start Services

```bash
# Start all services
docker-compose -f docker-compose-prod.yml up -d

# Check service status
docker-compose -f docker-compose-prod.yml ps

# View logs
docker-compose -f docker-compose-prod.yml logs -f backend
```

### 3. Verify Deployment

```bash
# Health check
curl https://yourdomain.com/health

# API check
curl https://yourdomain.com/api/auth/status

# Frontend check
curl https://yourdomain.com/
```

---

## Backup & Recovery

### Database Backup

```bash
# Backup PostgreSQL
docker-compose -f docker-compose-prod.yml exec -T postgres \
  pg_dump -U ${DB_USER} ${DB_NAME} \
  | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore from backup
gunzip < backup.sql.gz | docker-compose exec -T postgres \
  psql -U ${DB_USER} ${DB_NAME}
```

### Data Backup

```bash
# Backup volumes
docker run --rm -v voting-postgres_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/postgres_$(date +%Y%m%d).tar.gz -C /data .
```

---

## Monitoring & Maintenance

### Health Monitoring

```bash
# Check container health
docker-compose -f docker-compose-prod.yml ps

# View resource usage
docker stats

# Check logs for errors
docker-compose -f docker-compose-prod.yml logs --tail=100 backend
```

### Log Aggregation

```bash
# Collect logs
docker-compose -f docker-compose-prod.yml logs > system.log

# Search for errors
grep -i error system.log
```

### Updates & Patching

```bash
# Update base images
docker pull node:18-alpine
docker pull postgres:15-alpine
docker pull redis:7-alpine

# Rebuild with new images
docker-compose -f docker-compose-prod.yml build --no-cache
```

---

## Performance Optimization

### 1. Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_votes_room ON votes(room_id);
CREATE INDEX idx_rooms_creator ON voting_rooms(creator_id);

-- Vacuum analyze
VACUUM ANALYZE;
```

### 2. Redis Caching

```bash
# Monitor Redis
redis-cli monitor

# Check memory usage
redis-cli INFO memory
```

### 3. Nginx Optimization

```nginx
# Already configured in nginx.conf
- Gzip compression
- TCP optimization
- Connection pooling
- Rate limiting
```

---

## Security Considerations

### 1. Firewall Rules

```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Restrict other ports
ufw default deny incoming
```

### 2. SSL/TLS Renewal

```bash
# Setup automatic renewal
certbot renew --dry-run

# Or manual renewal
certbot renew
```

### 3. Secret Management

```bash
# Use environment variables (already configured)
# Consider using HashiCorp Vault for larger deployments
```

### 4. Database Security

```bash
# Use strong passwords
# Enable SSL connections
# Restrict database access to backend only
```

---

## Troubleshooting

### Common Issues

#### Services won't start
```bash
# Check logs
docker-compose logs backend

# Verify environment variables
docker-compose config

# Check port availability
netstat -tuln | grep 5000
```

#### Database connection errors
```bash
# Verify PostgreSQL is running
docker-compose ps postgres

# Check database credentials
docker-compose exec postgres psql -U ${DB_USER} -d ${DB_NAME}
```

#### High CPU/Memory usage
```bash
# Check resource limits
docker stats

# Optimize queries
docker-compose exec postgres EXPLAIN ANALYZE <query>
```

---

## Scaling Considerations

### Horizontal Scaling

```bash
# Deploy multiple backend instances
# Use load balancer (Nginx already configured)
# Use centralized database
# Use Redis for session storage
```

### Vertical Scaling

```bash
# Increase Docker resource limits
# Update server hardware
# Optimize application code
```

---

## Rollback Procedures

```bash
# Tag production images
docker tag voting-backend:latest voting-backend:v1.0.0

# Rollback to previous version
docker-compose -f docker-compose-prod.yml down
docker pull voting-backend:v1.0.0
docker-compose -f docker-compose-prod.yml up -d
```

---

## Support & Monitoring

### External Monitoring Services

- Sentry (Error tracking): Configure SENTRY_DSN
- DataDog (Monitoring): Configure DATADOG_API_KEY
- CloudFlare (CDN/DDoS): Configure DNS

---

## Emergency Contacts

- DevOps Team: [contact info]
- Security Team: [contact info]
- Database Admin: [contact info]

---

## Version Control

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2024-01-01 | Initial production deployment guide |

---

**Last Updated**: 2024-01-01
**Deployment Status**: Ready for Production
