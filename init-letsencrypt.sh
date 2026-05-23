#!/bin/bash
# Run once on the server to bootstrap the Let's Encrypt certificate.
# After this, certbot auto-renews every 12h via docker compose.
set -e

DOMAIN="camshare.uplisoft.com"
EMAIL="damjanoda@gmail.com"
STAGING=0  # Set to 1 to use staging CA while testing (avoids rate limits)

mkdir -p ./certbot/conf/live/"$DOMAIN" ./certbot/www

if [ ! -f "./certbot/conf/live/$DOMAIN/fullchain.pem" ]; then
  echo "Creating temporary self-signed certificate so nginx can start ..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "./certbot/conf/live/$DOMAIN/privkey.pem" \
    -out    "./certbot/conf/live/$DOMAIN/fullchain.pem" \
    -subj "/CN=$DOMAIN" 2>/dev/null
fi

echo "Building and starting nginx ..."
docker compose up --build -d nginx

echo "Waiting for nginx to be ready ..."
sleep 5

STAGING_ARG=""
[ "$STAGING" -ne 0 ] && STAGING_ARG="--staging"

echo "Requesting Let's Encrypt certificate for $DOMAIN ..."
docker compose run --rm certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  $STAGING_ARG \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  -d "$DOMAIN"

echo "Reloading nginx with real certificate ..."
docker compose exec nginx nginx -s reload

echo ""
echo "Certificate obtained. Start remaining services:"
echo "  docker compose up -d"
