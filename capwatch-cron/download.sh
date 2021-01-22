#!/bin/sh

<<LICENSE
 Copyright (C) 2020 Andrew Rioux
 
 This file is part of EvMPlus.org.
 
 EvMPlus.org is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 2 of the License, or
 (at your option) any later version.
 
 EvMPlus.org is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License
 along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
LICENSE

echo "Starting CAPWATCH import on $(date)"

cd /usr/evm-plus/packages/util-cli

echo "Downloading CAPWATCH file"

CAPWATCH_ZIP_PATH=$(node dist/downloadCapwatchInContainer.js)

echo "Starting CAPWATCH import"

node --no-warnings dist/importCapwatch.js $CAPWATCH_ZIP_PATH

echo "Done with CAPWATCH import"

[ ! -z "$KEEP_CAPWATCH_ZIP" ] && rm $CAPWATCH_ZIP_PATH

echo "Performing Discord updates"

cd /usr/evm-plus/packages/discord-bot

test -f /run/secrets/discord_client_token && node --no-warnings dist/index.js updateservers

echo "Done with Discord updates"