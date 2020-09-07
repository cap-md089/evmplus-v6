# Copyright (C) 2020 Andrew Rioux
# 
# This file is part of EvMPlus.org.
# 
# EvMPlus.org is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 2 of the License, or
# (at your option) any later version.
# 
# EvMPlus.org is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.

FROM node:13 AS builder

WORKDIR /usr/evm-plus

RUN npm install --global lerna@3.22.1

ARG REMOTE_DRIVE_KEY_FILE
COPY $REMOTE_DRIVE_KEY_FILE /usr/evm-plus/remote_drive_key
ENV REMOTE_DRIVE_KEY_FILE /usr/evm-plus/remote_drive_key

# Copy all packages and build them with development dependencies
COPY lerna.json package.json tsconfig.* yarn.lock ./
COPY packages ./packages
COPY types ./types
RUN yarn install
RUN lerna run build

CMD [ "npm", "--prefix", "packages/server", "start" ]

FROM node:13 AS runner

WORKDIR /usr/evm-plus

# Install the unzip command to import CAPWATCH files
RUN apt-get update \
	&& apt-get install -y unzip imagemagick --no-install-recommends \
	&& npm install --global lerna@3.22.1

COPY --from=builder /usr/evm-plus/remote_drive_key /usr/evm-plus/remote_drive_key
COPY --from=builder /usr/evm-plus/packages /usr/evm-plus/packages
COPY --from=builder /usr/evm-plus/package.json /usr/evm-plus/package.json
COPY --from=builder /usr/evm-plus/lerna.json /usr/evm-plus/lerna.json
COPY --from=builder /usr/evm-plus/yarn.lock /usr/evm-plus/yarn.lock
RUN lerna bootstrap -- --production

# Configure the server to use the right reCAPTCHA keys and built client
ENV REMOTE_DRIVE_KEY_FILE /usr/evm-plus/remote_drive_key
ENV GOOGLE_KEYS_PATH /google-keys
ENV NODE_ENV production
ENV CLIENT_PATH /usr/evm-plus/packages/client
EXPOSE 3001

CMD cd /usr/evm-plus/packages/server && node dist/index.js
