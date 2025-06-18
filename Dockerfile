# ==============================================
# FAMACHAT DOCKERFILE - PRODUCTION BUILD
# ==============================================

FROM node:20-alpine

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S famachat -u 1001

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Create required directories
RUN mkdir -p /app/server/uploads && \
    chown -R famachat:nodejs /app

# Switch to non-root user
USER famachat

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/system/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--no-deprecation", "dist/index.js"]