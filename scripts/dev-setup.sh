#!/bin/sh

<<LICENSE
 Copyright (C) 2021 Andrew Rioux
 
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

git config core.hooksPath hooks
lerna bootstrap
lerna run build --ignore client

cat <<EOD > packages/client/.env
SKIP_PREFLIGHT_CHECK=true
REACT_APP_HOSTNAME=localevmplus.org
REACT_APP_RECAPTCHA_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
DANGEROUSLY_DISABLE_HOST_CHECK=true
EOD

echo -n 6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe > keys/recaptcha_secret