# Multi-stage build for optimal image size and security
FROM node:24-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install dependencies with security optimizations
RUN if [ -f yarn.lock ]; then \
        yarn install --frozen-lockfile --production=false && \
        yarn cache clean; \
    else \
        npm ci --only=production=false && \
        npm cache clean --force; \
    fi

# Build Stage
FROM base AS build

# Copy source code
COPY . .

# Build TypeScript to JavaScript
RUN if [ -f yarn.lock ]; then \
        yarn build; \
    else \
        npm run build; \
    fi

# Production Stage
FROM node:24-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY yarn.lock* ./

# Install production dependencies only
RUN if [ -f yarn.lock ]; then \
        yarn install --frozen-lockfile --production=true && \
        yarn cache clean; \
    else \
        npm ci --only=production && \
        npm cache clean --force; \
    fi

# Copy built application from build stage
COPY --from=build --chown=nodejs:nodejs /app/dist ./dist

# Copy configuration files (only if they exist)
COPY --chown=nodejs:nodejs .env* ./

# Set environment variables for Node.js optimization
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/api/v1/health/live', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"] 