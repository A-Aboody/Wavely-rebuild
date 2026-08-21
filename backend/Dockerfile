# Build from the repo root: docker build -f backend/Dockerfile -t wavely-backend .
FROM node:22-alpine

RUN apk add --no-cache openssl
WORKDIR /app

# shared/ is a file: dependency of backend/package.json, so it must exist before npm ci
COPY shared/ ./shared/
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

WORKDIR /app/backend
RUN npm ci
RUN npx prisma generate

COPY backend/ ./

EXPOSE 3001
CMD ["npm", "run", "start:dev"]
