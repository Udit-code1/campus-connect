# Stage 1: Build stage
FROM node:18-alpine AS build

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

# Build the production bundle
RUN npm run build

# Stage 2: Production serve stage
FROM nginx:alpine

# Copy built assets from stage 1 to nginx public directory
COPY --from=build /usr/src/app/dist /usr/share/nginx/html

# Copy custom Nginx configuration if any, otherwise default is fine.
# We'll expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
