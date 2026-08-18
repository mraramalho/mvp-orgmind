FROM node:26-alpine3.22 AS base

WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM base AS test
COPY . .
CMD ["npm", "test"]

FROM base AS build
COPY . .
RUN npm run test && npm run lint && npm run build

FROM nginx:1.29.1-alpine3.22 AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/dist /usr/share/nginx/html
EXPOSE 80
