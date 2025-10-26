FROM node:20.19.0-alpine AS build

WORKDIR /app

RUN apk update && apk add --no-cache \
    git \
    nano \
    curl \
    ca-certificates \
    openssh

RUN npm install -g @angular/cli

COPY package*.json ./

RUN npm ci

COPY . .
RUN ng build --configuration production

FROM nginx:alpine
COPY --from=build /app/dist/quizstrike/browser/. /usr/share/nginx/html

ENV NODE_ENV=production

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]