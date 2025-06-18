# ==============================================
# FAMACHAT DOCKERFILE - MULTI-STAGE BUILD
# ==============================================

# Stage 1: Build dependencies and frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (including dev dependencies for build)
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build frontend and backend
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runtime

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S famachat -u 1001

WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=famachat:nodejs /app/dist ./dist
COPY --from=builder --chown=famachat:nodejs /app/client/dist ./client/dist
COPY --from=builder --chown=famachat:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=famachat:nodejs /app/package*.json ./
COPY --from=builder --chown=famachat:nodejs /app/drizzle.config.ts ./

# Create required directories
RUN mkdir -p /app/server/uploads && \
    chown -R famachat:nodejs /app/server/uploads

# Switch to non-root user
USER famachat

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/system/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start application with dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--no-deprecation", "dist/index.js"]