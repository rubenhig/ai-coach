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

# Imagen final de producción
FROM node:22-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 4000
CMD ["node", "dist/index.js"]
