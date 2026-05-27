# Frontend Deploy Pipeline

## Server details
- **Host:** `72.61.183.120`
- **User:** `root`
- **Project path:** `/var/www/camshare-uplisoft-com`
- **Served from:** `/var/www/camshare-uplisoft-com/public` (system nginx)
- **Live URL:** `https://camshare.uplisoft.com`

---

## Prerequisites (local)

Changes must be committed and pushed to `origin/main` before deploying.

```bash
git status          # confirm nothing uncommitted
git push            # push to GitHub if not already
```

---

## Deploy steps

### 1. SSH into server

```bash
ssh root@72.61.183.120
```

### 2. Pull latest code

```bash
cd /var/www/camshare-uplisoft-com
git pull
```

### 3. Build the client

```bash
pnpm --filter @camshare/client build
```

Output lands in `apps/client/dist/`.

### 4. Publish to public directory

```bash
rm -rf public/* && cp -r apps/client/dist/* public/
```

No nginx restart needed — nginx serves files directly from `public/`.

### 5. Verify

```bash
curl -s -o /dev/null -w '%{http_code}' https://camshare.uplisoft.com
# expect: 200
```

---

## One-liner (run locally via sshpass)

```bash
sshpass -p 'PASSWORD' ssh -o StrictHostKeyChecking=no root@72.61.183.120 \
  "cd /var/www/camshare-uplisoft-com && git pull && pnpm --filter @camshare/client build && rm -rf public/* && cp -r apps/client/dist/* public/ && echo 'Deploy done'"
```

Replace `PASSWORD` with the server password (see team vault).

---

## Notes

- Node.js `20.18.1` and pnpm `10.x` are installed on the server — no install step needed unless `package.json` changed (run `pnpm install` before build in that case).
- The API runs in Docker and is **not** affected by frontend deploys.

---

# API Deploy Pipeline

The API runs in Docker. The server uses the legacy **docker-compose v1** (`docker-compose`, not `docker compose`), which has a `ContainerConfig` bug that prevents recreating existing containers. The workaround is to remove the old API container before starting the new one. **Never remove the postgres container.**

---

## Deploy steps

### 1. SSH + pull

```bash
ssh root@72.61.183.120
cd /var/www/camshare-uplisoft-com
git pull
```

### 2. Build the new image

```bash
docker-compose build api
```

### 3. Swap the container (workaround for docker-compose v1 bug)

```bash
docker-compose stop api
docker-compose rm -f api
docker-compose up -d --no-deps api
```

### 4. If postgres stopped during the process, restart it

```bash
docker ps -a | grep postgres   # check status
docker start <postgres-container-name>
```

The postgres container name follows the pattern `camshare-uplisoft-com_postgres_1` (may have a hash prefix from the original creation — use whatever `docker ps -a` shows).

### 5. Verify

```bash
curl -s https://camshare.uplisoft.com/api/health
# expect: {"ok":true}

docker-compose logs --tail=30 api   # check for startup errors
```

---

## One-liner (run locally via sshpass)

```bash
sshpass -p 'PASSWORD' ssh -o StrictHostKeyChecking=no root@72.61.183.120 \
  "cd /var/www/camshare-uplisoft-com && git pull && docker-compose build api && docker-compose stop api && docker-compose rm -f api && docker-compose up -d --no-deps api && echo 'API deploy done'"
```

---

## Deploy both API + frontend together

```bash
sshpass -p 'PASSWORD' ssh -o StrictHostKeyChecking=no root@72.61.183.120 "
  cd /var/www/camshare-uplisoft-com &&
  git pull &&
  docker-compose build api &&
  docker-compose stop api &&
  docker-compose rm -f api &&
  docker-compose up -d --no-deps api &&
  pnpm --filter @camshare/client build &&
  rm -rf public/* &&
  cp -r apps/client/dist/* public/ &&
  echo 'Full deploy done'
"
```

---

## Notes

- **Never `docker rm` the postgres container** — all data lives in its volume.
- If `package.json` changed, run `pnpm install` on the server before building.
- `docker-compose v1` is installed at `/usr/local/bin/docker-compose` — use that, not `docker compose`.
