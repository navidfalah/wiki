# Self-contained -- unlike backend/, this image never touches compiler/ or
# data/ directly; every page it renders goes through the backend's REST
# API (BACKEND_API_URL), so the build context is just frontend/ itself.
FROM node:20-slim

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
