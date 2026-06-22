# Build stage
FROM node:20-alpine AS build
WORKDIR /app

# Copy package configuration files
COPY package.json package-lock.json ./

# Install dependencies using clean install
RUN npm ci

# Copy application source and build configuration
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy static assets from build stage to nginx directory
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
