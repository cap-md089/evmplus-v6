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

set -eu

cd ..

rsa_key_size=4096
data_path="./keys/certbot"
email="eventsupport@md.cap.gov"
staging="0"
domain="events.md.cap.gov"

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi

filter_func="account.id === 'md001' || (account.type === 'CAPGroup' && account.parent && account.parent.value === 'md001') || (account.type === 'CAPSquadron' && account.parentWing && account.parentWing.value === 'md001') || (account.type === 'CAPEvent' && account.parent.value === 'md001')"
get_accounts_file="/usr/evm-plus/packages/util-cli/dist/getAccounts.js"

docker_compose_file_arg=""
if [[ "$staging" == "1" ]]; then
  docker_compose_file_arg="-f docker-compose.dev.yml"
fi

unit_ids=$(docker-compose $docker_compose_file_arg run --use-aliases util-cli $get_accounts_file "$filter_func" "[account.id]")
unit_ids=$(echo $unit_ids | tail -n 1)
unit_ids="${unit_ids//[$'\r\n\t']}"

echo "Unit ids: ${unit_ids[*]}"

staging_arg=""
if [[ "$staging" == "1" ]]; then
  staging_arg="--staging"
fi

domain_arg="-d $domain"

path="/etc/letsencrypt/live/$domain"

echo "! Generating configuration"
docker-compose run --rm --use-aliases --volume=$PWD/nginx:/nginx util-cli node --no-warnings '/usr/evm-plus/packages/util-cli/dist/generateNginxConfig.js' '/nginx' "$domain" "$filter_func" true

docker-compose up -d --force-recreate --no-deps proxy

echo "! Generating root key"

docker-compose run --rm --entrypoint "\
certbot certonly --webroot -w /var/www/certbot \
    --email $email \
    $domain_arg \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --non-interactive \
    $staging_arg" certbot-web

for unit_id in ${unit_ids//,/ }; do
  echo "! Generating key for $unit_id"

  docker-compose up -d --force-recreate --no-deps proxy

  unit_url_prefixes=$(docker-compose $docker_compose_file_arg run --use-aliases util-cli $get_accounts_file "account.id === '$unit_id'")
  unit_url_prefixes=$(echo $unit_url_prefixes | tail -n 1)
  unit_url_prefixes="${unit_url_prefixes//[$'\r\n\t']}"

  domain_arg=""
  for unit_url_prefix in ${unit_url_prefixes//,/ }; do
    domain_arg="$domain_arg -d $unit_url_prefix.$domain"
  done

  unit_domain="${unit_id}.${domain}"

  path="/etc/letsencrypt/live/$unit_domain"

  docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
      --email $email \
      $domain_arg \
      --rsa-key-size $rsa_key_size \
      --agree-tos \
      --non-interactive \
      $staging_arg" certbot-web
done

docker-compose run --rm --use-aliases --volume=$PWD/nginx:/nginx util-cli node --no-warnings '/usr/evm-plus/packages/util-cli/dist/generateNginxConfig.js' '/nginx' "$domain" "$filter_func"

docker-compose exec proxy nginx -s reload
