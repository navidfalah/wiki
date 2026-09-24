# syntax=docker/dockerfile:1
#
# Self-contained -- unlike backend/, this image never touches compiler/ or
# data/ directly; every page it renders goes through the backend's REST
# API (BACKEND_API_URL), so the build context is just frontend/ itself.
#
# Two stages: the build stage has esbuild + Tailwind + tsc (devDependencies);
# the runtime stage gets only the compiled server, the built CSS/JS/fonts, the
# EJS templates, and production node_modules (express, ejs, proxy, cookies).
# No data/compiler bind mounts here, so no host-uid caveat -- everything
# this image writes stays inside the container.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-static ./dist-static
# Templates are read at runtime from <cwd>/src/views (see src/index.ts).
COPY --from=build /app/src/views ./src/views

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
