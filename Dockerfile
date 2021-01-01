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

FROM node:14 AS builder

WORKDIR /usr/evm-plus

RUN yarn global add lerna@3.22.1

# Copy all packages and build them with development dependencies
COPY lerna.json package.json tsconfig.* yarn.lock ./
COPY packages/apis/package.json packages/apis/package.json
COPY packages/auto-client-api/package.json packages/auto-client-api/package.json
COPY packages/client/package.json packages/client/package.json
COPY packages/common-lib/package.json packages/common-lib/package.json
COPY packages/discord-bot/package.json packages/discord-bot/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/server-common/package.json packages/server-common/package.json
COPY packages/server-jest-config/package.json packages/server-jest-config/package.json
COPY packages/util-cli/package.json packages/util-cli/package.json
RUN yarn install

COPY types/mysql__xdevapi/index.d.ts ./types/mysql__xdevapi/index.d.ts
COPY packages ./packages
RUN lerna run build

CMD [ "npm", "--prefix", "packages/server", "start" ]

FROM node:14 AS runner

WORKDIR /usr/evm-plus

# All the packages have been downloaded already, skip some of the time spent re-downloading with this
COPY --from=builder /usr/local/share/.cache/yarn/v6 /usr/local/share/.cache/yarn/v6

# Install the unzip command to import CAPWATCH files and the imagemagick library for favicons
RUN apt-get update \
	&& apt-get install -y unzip imagemagick --no-install-recommends \
	&& yarn global add lerna@3.22.1

COPY --from=builder /usr/evm-plus/packages /usr/evm-plus/packages
COPY --from=builder /usr/evm-plus/package.json /usr/evm-plus/package.json
COPY --from=builder /usr/evm-plus/lerna.json /usr/evm-plus/lerna.json
COPY --from=builder /usr/evm-plus/yarn.lock /usr/evm-plus/yarn.lock
RUN lerna bootstrap -- --production && rm -rf /usr/local/share/.cache/yarn/v6

# Configure the server to use the right reCAPTCHA keys and built client
ENV NODE_ENV production
EXPOSE 3001

# Use no warnings because @mysql/xdevapi isn't updated for node 14
# It still works, it just generates a stupid amount of warnings
WORKDIR /usr/evm-plus/packages/server
CMD node --no-warnings dist/index.js
