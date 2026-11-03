FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY server.js ./server.js
COPY src ./src

ENV PORT=3187
ENV CACHE_TTL_MS=15000

EXPOSE 3187

CMD ["node", "server.js"]