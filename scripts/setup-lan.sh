#!/bin/bash
# Detect current LAN IP (tries en0 then en1, falls back to localhost)
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null \
  || ipconfig getifaddr en1 2>/dev/null \
  || echo "localhost")

echo "[setup-lan] LAN IP: $LAN_IP"

cat > "$(dirname "$0")/../apps/client/.env.development" <<EOF
VITE_API_URL=http://$LAN_IP:3001
VITE_SOCKET_URL=http://$LAN_IP:3001
EOF

echo "[setup-lan] Written apps/client/.env.development"
