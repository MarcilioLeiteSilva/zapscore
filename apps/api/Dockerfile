# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Transer package configuration
COPY package*.json ./

# Install development dependencies
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Copy production dependencies from host (as we will reinstall production)
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the API port
EXPOSE 3000

# Run the app
CMD ["node", "dist/main"]
