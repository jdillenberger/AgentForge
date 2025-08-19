# Multi-stage Dockerfile for GHMD Editor
# Build both frontend and backend with optimized production images

# Base Node.js image for all stages
FROM node:22-alpine AS base-node
WORKDIR /app
RUN apk add --no-cache git

# Backend dependency installation
FROM base-node AS backend-deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production && npm cache clean --force

# Backend development dependencies (for building)
FROM base-node AS backend-build-deps
COPY backend/package*.json ./backend/
RUN cd backend && npm ci && npm cache clean --force

# Backend build stage
FROM backend-build-deps AS backend-build
COPY backend/ ./backend/
RUN cd backend && npm run build

# Frontend dependency installation
FROM base-node AS frontend-deps
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci && npm cache clean --force

# Frontend build stage
FROM frontend-deps AS frontend-build
COPY frontend/ ./frontend/
# Build-time environment variables can be passed here
ARG VITE_API_BASE_URL
ARG VITE_APP_TITLE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_TITLE=$VITE_APP_TITLE
RUN cd frontend && npm run build

# Backend production runtime
FROM node:22-alpine AS backend
WORKDIR /app

# Install git (required for schema repository cloning)
RUN apk add --no-cache git

# Install production dependencies
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY --from=backend-deps /app/backend/package*.json ./

# Copy built application
COPY --from=backend-build /app/backend/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/server.js"]

# Frontend production runtime with nginx
FROM nginx:alpine AS frontend
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist .

# Copy nginx configuration
COPY <<EOF /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle client-side routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy to backend service
    location /api {
        proxy_pass http://backend:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
        proxy_request_buffering off;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Health check for nginx
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

# Development target (optional - for development with hot reload)
FROM base-node AS development
WORKDIR /app

# Install all dependencies for both frontend and backend
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN cd backend && npm ci
RUN cd frontend && npm ci

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Expose ports for both services
EXPOSE 3000 5173

# Development command (can be overridden in docker-compose)
CMD ["npm", "run", "dev"]