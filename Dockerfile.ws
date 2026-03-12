FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy server code and dependencies
COPY server/ ./server/
COPY tsconfig.json ./

EXPOSE 3001

CMD ["npx", "tsx", "server/websocket.ts"]
