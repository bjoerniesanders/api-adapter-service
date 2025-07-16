# Docker Setup for API Adapter Service

This documentation describes how to configure and run the API Adapter Service with Docker and Node.js 24.

## Overview

The project uses Multi-Stage Docker Builds optimized for Node.js 24 with enhanced security and performance:

- **Base Stage**: Installs all dependencies (Development + Production)
- **Build Stage**: Compiles TypeScript to JavaScript
- **Production Stage**: Creates minimal production image with security hardening

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- At least 512MB available RAM
- Node.js 24+ (for local development)

## Quick Start

### 1. Production Build

```bash
# Build Docker image
docker build -t api-adapter-service .

# Start container
docker run -d \
  --name api-adapter-service \
  -p 4000:4000 \
  --env-file .env \
  api-adapter-service
```

### 2. With Docker Compose

```bash
# Start production service
docker-compose up -d

# Start development service (with hot reload)
docker-compose --profile dev up -d
```

### 3. Using Scripts

```bash
# Build with script
./scripts/docker-build.sh

# Run with compose script
./scripts/docker-compose.sh up -d

# Health check
./scripts/docker-compose.sh health
```

## Docker Compose Services

### Production Service (`api-adapter-service`)

- **Port**: 4000
- **Environment**: Production
- **Node.js**: 24-alpine
- **Memory Limit**: 512MB
- **CPU Limit**: 0.5 cores
- **Security**: Read-only filesystem, no-new-privileges
- **Health Check**: Automatic monitoring with improved reliability
- **Restart Policy**: `unless-stopped`

### Development Service (`api-adapter-service-dev`)

- **Port**: 4001
- **Environment**: Development
- **Node.js**: 24-alpine
- **Memory Limit**: 1GB
- **CPU Limit**: 1.0 cores
- **Hot Reload**: Automatic reload on code changes
- **Volumes**: Source code is mounted

## Dockerfile Details

### Multi-Stage Build with Node.js 24

```dockerfile
# Base Stage - Install dependencies
FROM node:24-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app
COPY package*.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=false && \
    yarn cache clean

# Build Stage - Compile TypeScript
FROM base AS build
COPY . .
RUN yarn build

# Production Stage - Minimal image with security
FROM node:24-alpine AS production
# ... Security & Production Setup with dumb-init
```

### Node.js 24 Optimizations

- **Alpine Linux**: Minimal base image (reduced attack surface)
- **dumb-init**: Proper signal handling for graceful shutdowns
- **Non-root User**: Container runs as `nodejs` user (UID 1001)
- **Memory Optimization**: `--max-old-space-size=512` for production
- **Cache Cleaning**: Reduced image size
- **Multi-stage Build**: No build tools in production image

### Security Features

- **Read-only Filesystem**: `/tmp` and `/var/tmp` as tmpfs
- **No New Privileges**: Prevents privilege escalation
- **Resource Limits**: Memory and CPU constraints
- **Health Checks**: Automatic application monitoring
- **Signal Handling**: Proper shutdown with dumb-init

## Environment Variables

### Required Variables

```bash
# Server Configuration
PORT=4000
HOST=0.0.0.0
NODE_ENV=production

# Node.js Optimization
NODE_OPTIONS=--max-old-space-size=512

# Adapter Configuration
ADAPTERS_EXAMPLE_API_BASE_URL=https://api.example.com
ADAPTERS_WEATHER_API_BASE_URL=https://api.weatherapi.com
```

### Optional Variables

```bash
# Cache Configuration
CACHE_ENABLED=true
CACHE_TTL=300000
CACHE_MAX_SIZE=1000

# Retry Configuration
ADAPTERS_DEFAULT_RETRIES=3
ADAPTERS_DEFAULT_TIMEOUT=5000

# Logging
LOG_LEVEL=info
```

## Deployment

### 1. Local Testing

```bash
# Build and test image
docker build -t api-adapter-service:test .
docker run --rm -p 4000:4000 api-adapter-service:test

# Health Check
curl http://localhost:4000/api/v1/health
```

### 2. Production Deployment

```bash
# Build image with tag
docker build -t api-adapter-service:latest .

# Start container with resource limits
docker run -d \
  --name api-adapter-service \
  -p 4000:4000 \
  --restart unless-stopped \
  --memory=512m \
  --cpus=0.5 \
  --security-opt no-new-privileges \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /var/tmp \
  --env-file .env.production \
  api-adapter-service:latest
```

### 3. Docker Compose Production

```bash
# Start production stack
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f api-adapter-service

# Service status
docker-compose ps
```

## Monitoring & Logs

### Container Logs

```bash
# Show all logs
docker logs api-adapter-service

# Follow logs
docker logs -f api-adapter-service

# Last 100 lines
docker logs --tail 100 api-adapter-service
```

### Health Checks

```bash
# Container health status
docker inspect api-adapter-service | grep Health -A 10

# Manual health check
curl http://localhost:4000/api/v1/health/live
```

### Metrics

```bash
# Container resources
docker stats api-adapter-service

# Detailed information
docker inspect api-adapter-service
```

## Node.js 24 Features

### Performance Improvements

- **V8 Engine**: Latest V8 engine with performance optimizations
- **Memory Management**: Improved garbage collection
- **TypeScript Support**: Experimental native TypeScript support
- **ES2024 Features**: Latest ECMAScript features available

### Security Enhancements

- **Alpine Linux**: Minimal attack surface
- **Non-root Execution**: Enhanced security model
- **Resource Limits**: Prevents resource exhaustion
- **Signal Handling**: Proper shutdown handling

## Troubleshooting

### Common Issues

#### 1. Port already in use

```bash
# Check ports
lsof -i :4000

# Stop container
docker stop api-adapter-service
docker rm api-adapter-service
```

#### 2. Permission Denied

```bash
# Check Docker group
groups $USER

# Add user to Docker group
sudo usermod -aG docker $USER
```

#### 3. Build Errors

```bash
# Clear cache
docker builder prune

# Build without cache
docker build --no-cache -t api-adapter-service .
```

#### 4. Memory Issues

```bash
# Container memory limits
docker run -d \
  --name api-adapter-service \
  --memory=512m \
  --memory-swap=1g \
  -p 4000:4000 \
  api-adapter-service
```

#### 5. Node.js 24 Specific Issues

```bash
# Check Node.js version in container
docker exec api-adapter-service node --version

# Check TypeScript compilation
docker exec api-adapter-service yarn build

# Verify dumb-init installation
docker exec api-adapter-service which dumb-init
```

### Debugging

```bash
# Start container interactively
docker run -it --rm api-adapter-service sh

# Enter running container
docker exec -it api-adapter-service sh

# Check container logs
docker logs api-adapter-service
```

## Best Practices

### Security

- Always use non-root users
- Implement resource limits
- Use read-only filesystems where possible
- Regular security updates
- Scan images for vulnerabilities

### Performance

- Use multi-stage builds
- Optimize layer caching
- Clean up package caches
- Monitor resource usage
- Use appropriate base images

### Monitoring

- Implement health checks
- Monitor container metrics
- Set up logging aggregation
- Use proper signal handling
- Regular backup strategies 