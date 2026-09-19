FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json ./
COPY packages/api/package.json ./packages/api/
COPY packages/db/package.json ./packages/db/
COPY packages/queue/package.json ./packages/queue/
COPY packages/crawler/package.json ./packages/crawler/
RUN npm install --workspace=@gigw/api

# Generate Prisma client (required before build)
COPY packages/db/prisma ./packages/db/prisma
RUN npx prisma generate --schema=packages/db/prisma/schema.prisma

# Build
COPY tsconfig.base.json ./
COPY packages/api ./packages/api
COPY packages/db ./packages/db
COPY packages/queue ./packages/queue
COPY packages/crawler ./packages/crawler
RUN npm run build --workspace=@gigw/api

EXPOSE 3000
CMD ["node", "packages/api/dist/index.js"]
