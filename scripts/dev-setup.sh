#!/bin/sh

<<LICENSE
 Copyright (C) 2021 Andrew Rioux
 
 This file is part of Event Manager.
 
 Event Manager is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 2 of the License, or
 (at your option) any later version.
 
 Event Manager is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 
 You should have received a copy of the GNU General Public License
 along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
LICENSE

git config core.hooksPath hooks
lerna bootstrap
lerna run build --ignore client

cat <<EOD > packages/client/.env
SKIP_PREFLIGHT_CHECK=true
REACT_APP_HOSTNAME=localevmplus.org
REACT_APP_RECAPTCHA_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
DANGEROUSLY_DISABLE_HOST_CHECK=true
EOD

mkdir /run/secrets
echo -n 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe > keys/recaptcha_secret
echo -n em > keys/db_user
echo -n em > /run/secrets/db_user
echo -n toor > keys/db_password
echo -n toor > /run/secrets/db_password
echo -n > keys/discord_client_token
echo -n > keys/aws_access_key_id
echo -n > keys/aws_secret_access_key

packages/util-cli/dist/importFakeData.js