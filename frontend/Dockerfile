# Self-contained -- unlike backend/, this image never touches compiler/ or
# data/ directly; every page it renders goes through the backend's REST
# API (BACKEND_API_URL), so the build context is just frontend/ itself.
#
# Multi-stage: devDependencies (typescript, esbuild, tailwindcss, ...) are
# only needed to produce dist/ and dist-static/, not to run them -- the
# runtime stage below installs production deps only and copies in the
# built output.
FROM node:20-slim AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS runtime

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-static ./dist-static
COPY --from=build /app/src/views ./src/views

ENV NODE_ENV=production
EXPOSE 3000

# No data/compiler bind mounts here (see header comment), so no host-uid
# caveat -- everything this image writes stays inside the container.
USER node

# node:20-slim has no wget/curl by default -- use Node's own http client
# instead of adding a package just for the healthcheck.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (res) => process.exit(res.statusCode < 400 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "dist/index.js"]
