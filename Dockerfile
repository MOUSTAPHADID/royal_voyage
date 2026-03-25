FROM node:22-alpine AS base
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.12.0

# Copy package files and pnpm config
COPY package.json pnpm-lock.yaml .npmrc ./
# Install dependencies (node-linker=hoisted required for Expo/NativeWind)
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY . .

# Build web frontend
RUN npx expo export --platform web --output-dir web-dist

# Build server
RUN pnpm build

# Production stage
FROM node:22-alpine AS production
WORKDIR /app

RUN npm install -g pnpm@9.12.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=base /app/dist ./dist
COPY --from=base /app/web-dist ./web-dist

# Render uses port 10000 by default (PORT env var is set by Render)
EXPOSE 10000

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
