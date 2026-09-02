# --- build stage: compile TypeScript to dist/ ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- runtime stage: production deps only ---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 4000
USER node

# tsconfig `include: ["src"]` also compiles the seeder, so it is available at
# dist/seed/seed.js without shipping tsx or any devDependency.
CMD ["node", "dist/server.js"]
