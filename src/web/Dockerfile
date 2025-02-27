# Build stage
FROM node:18-alpine as build
WORKDIR /app
ENV NODE_ENV=production

# API URL can be overridden at build time
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Copy package files for better caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy app source
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:stable-alpine
WORKDIR /usr/share/nginx/html

# Copy built files from build stage
COPY --from=build /app/dist ./

# Configure nginx for SPA routing
RUN rm -rf /etc/nginx/conf.d/*
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Serve static assets with cache \
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ { \
        expires 30d; \
        add_header Cache-Control "public, no-transform"; \
    } \
    \
    # Application routes handling \
    location / { \
        try_files \$uri \$uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]