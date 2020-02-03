FROM node:13.7-alpine as dev-stage

MAINTAINER Kelly J Andrews <kelly@kellyjandrews.com>

WORKDIR /usr/src

COPY package.json .

RUN npm install --quiet

ENV PATH /usr/src/node_modules/.bin:$PATH

COPY . .

RUN npm run build

EXPOSE 8000

CMD ["npm", "run", "prod"]