# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start the application in development mode
CMD ["npm", "run", "dev"]

FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --production; fi

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/generated ./src/generated

# Copy generated Prisma client to the location expected by compiled JS
COPY --from=builder /app/src/generated ./dist/generated

# Generate Prisma Client (in case it's needed for runtime)
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start the application with migration
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
