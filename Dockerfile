FROM node:13 AS builder

WORKDIR /usr/capunit-com

ARG REMOTE_DRIVE_KEY_FILE
COPY $REMOTE_DRIVE_KEY_FILE /usr/capunit-com/remote_drive_key
ENV REMOTE_DRIVE_KEY_FILE /usr/capunit-com/remote_drive_key

ARG GOOGLE_KEYS_PATH
COPY $GOOGLE_KEYS_PATH /google-keys
ENV GOOGLE_KEYS_PATH /google-keys

# Go through each one in order, copying, installling dependencies, and building
COPY lib ./lib
RUN cd lib && npm install --no-package-lock && npm run build

COPY auto-client-api ./auto-client-api
RUN cd auto-client-api && npm install --no-package-lock && npm run build

COPY server-common ./server-common
RUN cd server-common && npm install --no-package-lock && npm run build -- --project tsconfig.build.json

COPY discord-bot ./discord-bot
RUN cd discord-bot && npm install --no-package-lock && npm run build

COPY apis ./apis
RUN cd apis && npm install --no-package-lock && npm run build

COPY client ./client
RUN cd client && npm install --no-package-lock && npm run build

COPY server ./server
RUN cd server && npm install --no-package-lock && npm run build -- --project tsconfig.build.json

FROM node:13 AS runner

WORKDIR /usr/capunit-com

# Install the unzip command to import CAPWATCH files
RUN apt-get update && apt-get install -y unzip

COPY --from=builder /usr/capunit-com/lib ./lib
RUN cd lib && npm install --no-package-lock --production

COPY --from=builder /usr/capunit-com/auto-client-api ./auto-client-api

COPY --from=builder /usr/capunit-com/server-common ./server-common
RUN cd server-common && npm install --no-package-lock --production

COPY --from=builder /usr/capunit-com/discord-bot ./discord-bot
RUN cd discord-bot && npm install --no-package-lock --production

COPY --from=builder /usr/capunit-com/apis ./apis
RUN cd apis && npm install --no-package-lock --production

COPY --from=builder /usr/capunit-com/client ./client
RUN cd client && npm install --no-package-lock --production

COPY --from=builder /usr/capunit-com/server ./server
RUN cd server && npm install --no-package-lock --production

# Configure the server to use the right reCAPTCHA keys and 
ENV NODE_ENV production
ENV CLIENT_PATH /usr/capunit-com/client
EXPOSE 3001

CMD cd server && node dist/index.js
