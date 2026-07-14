FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .
RUN npm install -g ts-node typescript

ENV NODE_ENV=production

CMD ["ts-node", "src/index.ts"]
