# ==============================================
# FAMACHAT DOCKERFILE - MULTI-STAGE BUILD
# ==============================================

# Stage 1: Build dependencies and frontend
FROM node:20-alpine AS builder

# Install comprehensive system dependencies for all native modules
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    gcc \
    musl-dev \
    linux-headers \
    libc6-compat \
    git \
    openssh \
    pkgconfig \
    pixman-dev \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    && rm -rf /var/cache/apk/*

# Set npm configuration for better native module compilation
RUN npm config set python python3 && \
    npm config set build-from-source true

WORKDIR /app

# Copy package files
COPY package*.json ./

# Clear npm cache and install with comprehensive dependency inclusion
RUN npm cache clean --force && \
    npm install --verbose --no-audit --include=dev --include=optional --fund=false

# Copy all source code
COPY . .

# Set NODE_ENV for build
ENV NODE_ENV=production

# Build frontend and backend with extended timeout
RUN npm run build --timeout=300000

# Verify build outputs exist and show structure
RUN echo "Build verification:" && \
    ls -la dist/ && \
    echo "Client build:" && \
    ls -la client/dist/ && \
    echo "Build completed successfully"

# Stage 2: Production runtime
FROM node:20-alpine AS runtime

# Install essential runtime dependencies for native modules
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    python3 \
    make \
    g++ \
    gcc \
    musl-dev \
    libc6-compat \
    curl \
    wget \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Set timezone
ENV TZ=America/Sao_Paulo

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S famachat -u 1001

WORKDIR /app

# Copy package files and install production dependencies
COPY --from=builder --chown=famachat:nodejs /app/package*.json ./

# Install production dependencies with native module support
RUN npm config set python python3 && \
    npm ci --only=production --include=optional --verbose && \
    npm cache clean --force

# Copy built application and essential runtime files
COPY --from=builder --chown=famachat:nodejs /app/dist ./dist
COPY --from=builder --chown=famachat:nodejs /app/client/dist ./client/dist
COPY --from=builder --chown=famachat:nodejs /app/drizzle.config.ts ./
COPY --from=builder --chown=famachat:nodejs /app/shared ./shared
COPY --from=builder --chown=famachat:nodejs /app/public ./public

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