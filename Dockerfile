FROM node:alpine

MAINTAINER ajkaanbal@gmail.com

WORKDIR /srv/app

COPY . .

RUN apk add bash && npm install

CMD ["node", "client.js"]

