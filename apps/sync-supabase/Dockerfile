# Estágio 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Estágio 2: Runtime (Produção leve e sem ts-node)
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Copia apenas o build javascript gerado
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
