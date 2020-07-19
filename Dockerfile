FROM node:13

WORKDIR /usr/capunit-com

# Install the unzip command to import CAPWATCH files
RUN apt-get update && apt-get install -y unzip

# Go through each one in order, copying, installling dependencies, and building
COPY apis ./apis
RUN cd lib && npm install
RUN cd lib && ./node_modules/.bin/tsc --version && npm run build

COPY auto-client-api ./auto-client-api
RUN cd auto-client-api && npm install
RUN cd auto-client-api && ./node_modules/.bin/tsc --version && npm run build

COPY client ./client
RUN cd server-common && npm install
RUN cd server-common && ./node_modules/.bin/tsc --version && npm run build -- --project tsconfig.build.json

COPY discord-bot ./discord-bot
RUN cd discord-bot && npm install
RUN cd discord-bot && ./node_modules/.bin/tsc --version && npm run build

COPY lib ./lib
RUN cd apis && npm install
RUN cd apis && ./node_modules/.bin/tsc --version && npm run build

COPY server ./server
RUN cd client && npm install
RUN cd client && ./node_modules/.bin/tsc --version && npm run build

COPY server-common ./server-common
RUN cd server && npm install
RUN cd server && ./node_modules/.bin/tsc --version && npm run build -- --project tsconfig.build.json

# This all can be commented out to build a staging build with dev dependencies still installed
# RUN cd lib && rm -rf node_modules && npm install --no-package-lock --production
# RUN cd auto-client-api && rm -rf node_modules && npm install --no-package-lock --production
# RUN cd server-common && rm -rf node_modules && npm install --no-package-lock --production
# RUN cd discord-bot && rm -rf node_modules && npm install --no-package-lock --production
# RUN cd apis && rm -rf node_modules && npm install --no-package-lock --production
# RUN cd client && rm -rf node_modules && npm install --no-package-lock --production
# RUN cd server && rm -rf node_modules && npm install --no-package-lock --production

# Configure the server to use the right reCAPTCHA keys and 
ENV NODE_ENV production
ENV CLIENT_PATH /usr/capunit-com/client
EXPOSE 3001

CMD cd server && node dist/index.js
