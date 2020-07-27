# Copyright (C) 2020 Andrew Rioux
# 
# This file is part of CAPUnit.com.
# 
# CAPUnit.com is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
# 
# CAPUnit.com is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.

FROM node:13 AS builder

WORKDIR /usr/capunit-com

ARG REMOTE_DRIVE_KEY_FILE
COPY $REMOTE_DRIVE_KEY_FILE /usr/capunit-com/remote_drive_key
ENV REMOTE_DRIVE_KEY_FILE /usr/capunit-com/remote_drive_key

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

COPY --from=builder /usr/capunit-com/remote_drive_key /usr/capunit-com/remote_drive_key
ENV REMOTE_DRIVE_KEY_FILE /usr/capunit-com/remote_drive_key

ENV GOOGLE_KEYS_PATH /google-keys

# Install the unzip command to import CAPWATCH files
RUN apt-get update && apt-get install -y unzip imagemagick --no-install-recommends

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
