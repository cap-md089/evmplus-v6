#!/bin/bash

domains=(capunit.com *.capunit.com evmplus.org *.evmplus.org)
rsa_key_size=4096
data_path="./keys/certbot"
email="andrew.rioux@mdwg.cap.gov"

if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
fi


domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"

  path="/etc/letsencrypt/live/$domain"
  mkdir -p "$data_path/conf/live/$domain"
  docker-compose run --rm --entrypoint "\
    openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
      -keyout '$path/privkey.pem' \
      -out '$path/fullchain.pem' \
      -subj '/CN=localhost'" certbot

  docker-compose up --force-recreate -d nginx

  docker-compose run --rm --entrypoint "\
    rm -rf /etc/letsencrypt/live/$domain && \
    rm -rf /etc/letsencrypt/archive/$domain && \
    rm -rf /etc/letsencrypt/renewal/$domain.conf" certbot
done

docker-compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    --email $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot

docker-compose exec nginx nginx -s reload