# Build Stage
FROM oven/bun:1-alpine AS builder
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy source and build
COPY . .
RUN bun run build

# Production Stage
FROM oven/bun:1-alpine AS production
WORKDIR /app

# Run as non-root user for security
USER bun

# Copy only the built output
COPY --from=builder --chown=bun:bun /app/.output ./.output

ENV NODE_ENV=production
EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
