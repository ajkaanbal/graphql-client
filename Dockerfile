FROM node:alpine

MAINTAINER ajkaanbal@gmail.com

WORKDIR /srv/app

COPY . .

RUN apk add bash jq && npm install

CMD ["node", "client.js"]

