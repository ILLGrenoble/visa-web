# stage1 as builder
FROM node:20-alpine as builder

COPY package.json package-lock.json ./

RUN apk update
RUN apk add --no-cache git

# build
RUN npm install --legacy-peer-deps && mkdir /visa-web && mv ./node_modules ./visa-web

WORKDIR /visa-web

COPY . .

RUN npm run build

# stage2 package with nginx
FROM nginx:1.19.0-alpine

COPY nginx/default.conf /etc/nginx/conf.d/

RUN rm -rf /usr/share/nginx/html/*

# Copy from stage 1
COPY --from=builder /visa-web/dist /usr/share/nginx/html

ENTRYPOINT ["nginx", "-g", "daemon off;"]
