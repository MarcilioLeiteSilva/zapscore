# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copia arquivos de configuração e instala dependências
COPY package*.json ./
RUN npm install

# Copia o código fonte
COPY . .

# Variável de build para o Next.js saber a URL da API durante o build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build do Next.js
RUN npm run build

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Copia apenas o necessário do build anterior
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

# Expõe a porta padrão do Next.js
EXPOSE 3000

# Inicia a aplicação
CMD ["npm", "start"]
