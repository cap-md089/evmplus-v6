#!/bin/bash

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


domains=(\*.capunit.com \*.evmplus.org)
rsa_key_size=4096
data_path="./keys/certbot"
email="eventsupport@md.cap.gov"
staging="0"

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi

staging_arg=""
if [[ "$staging" == "1" ]]; then
  staging_arg="--staging"
fi

for domain in "${domains[@]}"; do
  domain_path=$(echo $domain | sed 's/\*\.//')

  mkdir -p "$data_path/conf/live/$domain_path"

  docker-compose run --rm --entrypoint "\
    certbot certonly --dns-route53 \
      --email $email \
      -d $domain \
      --rsa-key-size $rsa_key_size \
      --agree-tos \
      --force-renewal \
      --non-interactive \
      $staging_arg" certbot-dns
done
