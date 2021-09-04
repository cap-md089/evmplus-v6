# syntax = docker/dockerfile:1.2

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

#
# This container is what is used by most of the node containers
#
FROM node:14-buster AS base

# Install the imagemagick library for favicons
RUN apt update && \
	apt install imagemagick \
	&& yarn global add lerna@3.22

#
# This container provides the compiler used in a development environment,
# and allows the compiler to persist
#
FROM base AS development-builder

WORKDIR /usr/evm-plus

RUN yarn global add typescript ttypescript \
	&& apt install git

#
# This container is used to program in a Docker environment, and access
# secrets necessary for execution (db_password, etc). This container
# will require a mount to /usr/evm-plus from the outside world
#
FROM base AS development

WORKDIR /usr/evm-plus/packages/server

# RUN apk add snap && snap install code-insiders --classic

ENV NODE_ENV=development

CMD yarn run debug

#
# Another container used for 
#
FROM base as client-development

WORKDIR /usr/evm-plus/packages/client

CMD yarn run start-quiet

#
# This container is used to produce compiled production JavaScript for
# execution
#
FROM base AS builder

WORKDIR /usr/evm-plus

# Copy all packages and build them with development dependencies
COPY lerna.json package.json yarn.lock ./
COPY packages/apis/package.json packages/apis/package.json
COPY packages/auto-client-api/package.json packages/auto-client-api/package.json
COPY packages/client/package.json packages/client/package.json
COPY packages/common-lib/package.json packages/common-lib/package.json
COPY packages/discord-bot/package.json packages/discord-bot/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/server-common/package.json packages/server-common/package.json
COPY packages/server-jest-config/package.json packages/server-jest-config/package.json
COPY packages/util-cli/package.json packages/util-cli/package.json
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn/v6 lerna bootstrap

COPY types ./types
COPY packages ./packages
COPY tsconfig.* ./
RUN --mount=type=cache,target=/usr/evm-plus/packages/apis/dist/ \
	--mount=type=cache,target=/usr/evm-plus/packages/auto-api-tests/apis/dist \
	--mount=type=cache,target=/usr/evm-plus/packages/auto-client-api/apis/dist \
	--mount=type=cache,target=/usr/evm-plus/packages/common-lib/apis/dist \
	--mount=type=cache,target=/usr/evm-plus/packages/discord-bot/apis/dist \
	--mount=type=cache,target=/usr/evm-plus/packages/server/apis/dist \
	--mount=type=cache,target=/usr/evm-plus/packages/server-common/apis/dist \
	--mount=type=cache,target=/usr/evm-plus/packages/server-jest-config/apis/dist \
	--mount=type=cache,target=/usr/evm-plus/packages/util-cli/apis/dist \
	lerna run build

#
# By creating an nginx container like this, we can statically serve HTML,
# JS, and CSS without bogging down the Node process
#
FROM nginx:1.15-alpine as website-proxy

COPY --from=builder /usr/evm-plus/packages/client/build /usr/evm-plus/client
COPY packages/server/images /usr/evm-plus/client/images

#
# This container is used to execute the compiled JavaScript
#
FROM base AS website-runner

RUN rm -rf /var/lib/{apt,dpkg,cache,log}

WORKDIR /usr/evm-plus

# All the packages have been downloaded already, skip some of the time spent re-downloading with this
COPY --from=builder /usr/local/share/.cache/yarn/v6 /usr/local/share/.cache/yarn/v6

COPY --from=builder /usr/evm-plus/packages /usr/evm-plus/packages
COPY --from=builder /usr/evm-plus/package.json /usr/evm-plus/package.json
COPY --from=builder /usr/evm-plus/lerna.json /usr/evm-plus/lerna.json
COPY --from=builder /usr/evm-plus/yarn.lock /usr/evm-plus/yarn.lock

RUN --mount=type=cache,target=/usr/local/share/.cache/yarn/v6 \
	rm -rf node_modules packages/*/node_modules \
	&& lerna bootstrap -- --production

# Configure the server to use the right reCAPTCHA keys and built client
ENV NODE_ENV production
ENV CLIENT_PATH /usr/evm-plus/packages/client
ENV GOOGLE_KEYS_PATH /google-keys
EXPOSE 3001

# Use no warnings because @mysql/xdevapi isn't updated for node 14
# It still works, it just generates a stupid amount of warnings
WORKDIR /usr/evm-plus/packages/server
CMD node --no-warnings dist/index.js

#
# This container will act as a simple container to hold and execute the
# tests for all the packages
#
FROM base AS tests

WORKDIR /usr/evm-plus

ENV IN_DOCKER_TEST_ENVIRONMENT=1
CMD yarn run --cwd=packages/server-jest-config test && \
	yarn run --cwd=packages/server-common test && \
	yarn run --cwd=packages/client test

#
# This container will run a cron job to import CAPWATCH and update Discord
# every night
#
FROM base AS cronjobs

WORKDIR /usr/mysqlsh

ENV LANG en_US.UTF-8

RUN apt update \
	&& apt install -y --no-install-recommends \
	ca-certificates apt-transport-https wget libpython2.7 python locales bash cron \
	&& rm -rf /var/lib/apt/lists/* \
	&& localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8 \
	&& wget https://dev.mysql.com/get/Downloads/MySQL-Shell/mysql-shell-8.0.25-linux-glibc2.12-x86-64bit.tar.gz \
	&& tar -xvf mysql-shell-8.0.25-linux-glibc2.12-x86-64bit.tar.gz \
	&& mv mysql-shell-8.0.25-linux-glibc2.12-x86-64bit /usr/local/mysql-shell

WORKDIR /usr/evm-plus

COPY --from=builder /usr/evm-plus/packages /usr/evm-plus/packages/
COPY --from=builder /usr/evm-plus/package.json /usr/evm-plus/package.json
COPY --from=builder /usr/evm-plus/lerna.json /usr/evm-plus/lerna.json
COPY --from=builder /usr/evm-plus/yarn.lock /usr/evm-plus/yarn.lock
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn/v6 lerna bootstrap -- --production

ENV NODE_ENV production

# Setup crontab
COPY cronjobs/crontab /etc/cron.d/crontab
COPY cronjobs/download.sh ./cronjobs/download.sh
COPY cronjobs/backup.sh ./cronjobs/backup.sh
COPY scripts/database-dump.js ./cronjobs/database-dump.js

RUN chmod 0744 /etc/cron.d/crontab \
	&& chmod 0744 /usr/evm-plus/cronjobs/download.sh \
	&& chmod 0744 /usr/evm-plus/cronjobs/backup.sh \
	&& crontab /etc/cron.d/crontab \
	&& touch /var/log/cron.log

ENTRYPOINT [ "sh" ]
CMD [ "-c", "cron && tail -f /var/log/cron.log" ]

#
# This container provides access to the different CLI utilities provided, such as
# creating a squadron account, adding SSL signin keys, or sending global notifications
#
FROM builder AS util-cli

WORKDIR /usr/evm-plus

COPY --from=builder /usr/evm-plus/packages /usr/evm-plus/packages/
COPY --from=builder /usr/evm-plus/package.json /usr/evm-plus/package.json
COPY --from=builder /usr/evm-plus/lerna.json /usr/evm-plus/lerna.json
COPY --from=builder /usr/evm-plus/yarn.lock /usr/evm-plus/yarn.lock
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn/v6 lerna bootstrap -- --production

WORKDIR /usr/evm-plus/packages/util-cli/dist

RUN chmod +x *.js
