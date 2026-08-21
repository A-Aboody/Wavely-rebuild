# Build from the repo root: docker build -f frontend/Dockerfile -t wavely-frontend .
FROM node:22-alpine

WORKDIR /app

# vite.config.ts aliases @wavely/shared to ../shared, so keep the repo layout
COPY shared/ ./shared/
COPY frontend/package*.json ./frontend/

WORKDIR /app/frontend
RUN npm ci

COPY frontend/ ./

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
