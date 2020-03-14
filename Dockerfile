FROM node:13

WORKDIR /usr/src/server

COPY lib ../lib

COPY server/package*.json ./

RUN npm install

COPY client ../client
COPY server .

RUN npm run build

EXPOSE 3001

CMD [ "node", "dist/index.js" ]
