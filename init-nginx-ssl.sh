#!/bin/bash

domains=(\*.capunit.com \*.evmplus.org)
rsa_key_size=4096
data_path="./keys/certbot"
email="eventsupport@md.cap.gov"
staging="1"

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
    certbot certonly --dns-route53 -w /var/www/certbot \
      --email $email \
      -d $domain \
      --rsa-key-size $rsa_key_size \
      --agree-tos \
      --force-renewal \
      --non-interactive \
      $staging_arg" certbot
done
