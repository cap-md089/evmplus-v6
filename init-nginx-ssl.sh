#!/bin/bash

rsa_key_size=4096
data_path="./keys/certbot"
email="eventsupport@md.cap.gov"
staging="1"
domain="events.md.cap.gov"

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi

filter_func="account.id === 'md001' || (account.type === 'CAPGroup' && account.parentWing.value === 'md001') || (account.type === 'CAPSquadron' && account.parentWing.value === 'md001')"
get_accounts_file="/usr/evm-plus/packages/util-cli/dist/getAccounts.js"

unit_url_prefixes=""
if [[ "$staging" == "1" ]]; then
  unit_url_prefixes=$(docker-compose -f docker-compose.dev.yml run --use-aliases util-cli $get_accounts_file "$filter_func")
else
  unit_url_prefixes=$(docker-compose run --use-aliases util-cli $get_accounts_file "$filter_func")
fi

unit_url_prefixes=$(echo $unit_url_prefixes | tail -n 1)

staging_arg=""
if [[ "$staging" == "1" ]]; then
  staging_arg="--staging"
fi

IFS=','
domain_arg="-d $domain"
for unit_url_prefix in "${unit_url_prefixes[@]}"; do	
  domain_arg="$domain_arg -d $unit_url_prefix.$domain"
done

path="/etc/letsencrypt/live/$domain"

docker-compose run --rm --entrypoint "\
openssl req =x509 -nodes -newkey rsa:$rsa_key_size -days 1\
	-keyout '$path/privkey.pem' \
	-out '$path/fullchain.pem' \
	-subj '/CN=localhost'" certbot-web

docker-compose up -d --force-recreate --no-deps proxy

docker-compose run --rm --entrypoint "\
	rm -rf /etc/letsencrypt/live/$domain && \
	rm -rf /etc/letsencrypt/archive/$domain && \
	rm -rf /etc/letsencrypt/renewal/$domain.conf" certbot-web

docker-compose run --rm --entrypoint "\
certbot certonly --webroot -w /var/www/certbot \
	--email $email \
	$domain_arg \
	--rsa-key-size $rsa_key_size \
	--agree-tos \
	--force-renewal \
	--non-interactive \
	$staging_arg" certbot-web
