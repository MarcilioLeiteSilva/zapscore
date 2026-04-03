# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Transfer package configuration and lockfile
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code and prisma configs
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Ensure openssl for Prisma runtime
RUN apk add --no-cache openssl

# Copy package files for production install
COPY package*.json ./
COPY prisma.config.ts ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy Prisma schema and generated clients from builder
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the API port
EXPOSE 3000

# Run the app (Caminho corrigido para a estrutura NestJS detectada)
CMD ["node", "dist/src/main"]
