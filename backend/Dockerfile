# Backend Dockerfile for Wavely
FROM node:18-alpine

# Install required packages
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start command (will be overridden in docker-compose for dev)
CMD ["npm", "run", "start:dev"]
