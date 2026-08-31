# Build context is wiki-app/ (a self-contained Node project, unlike
# compiler/ — see compiler/Dockerfile for why that one needs the repo root).
FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV HOST=0.0.0.0
EXPOSE 3000

# Dev server, matching `npm start` in the docs — docker-compose mounts
# wiki-app/ as a live volume so edits on the host are picked up without a
# rebuild. For a production image, use `npm run build` + a static file
# server instead (see build_wiki.sh for the non-Docker equivalent).
CMD ["npm", "start", "--", "--host", "0.0.0.0", "--port", "3000"]
