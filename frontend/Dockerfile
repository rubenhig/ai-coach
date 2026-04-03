FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Desarrollo con hot reload
FROM base AS dev
COPY . .
CMD ["npm", "run", "dev"]

# Build de producción
FROM base AS builder
COPY . .
RUN npm run build

# Imagen final de producción (ligera)
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
