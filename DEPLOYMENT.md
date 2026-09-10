# Deployment Guide: DigitalOcean VPS

This document explains the exact procedure for pushing updates to GitHub and deploying them live to the DigitalOcean VPS.

---

## Architecture Overview

- **Droplet IP**: `167.172.60.237` (Host user: `root`)
- **SSH Key**: `~/ocean/ocean`
- **Fish Shell Shortcut**: `ocean` (runs `ssh -i ~/ocean/ocean -L 3000:localhost:3000 root@167.172.60.237`)
- **Remote App Path**: `/root/services/hats_db`
- **Systemd Service**: `hats-db.service`
  - Runs `/root/services/hats_db/pocketbase serve --http=127.0.0.1:8090`
  - Environment file: `/root/services/hats_db/.env`
- **Reverse Proxy**: Caddy (`/etc/caddy/Caddyfile`)
  - Routes `https://hats.rabii.duckdns.org` -> `localhost:8090`
  - Routes `https://rabii.duckdns.org` -> `localhost:8090`
- **Public Health Endpoint**: `https://hats.rabii.duckdns.org/api/health`

---

## Step-by-Step Deployment Procedure

### Step 1: Commit and Push to Git (GitHub)

Always make sure local changes are committed and pushed to GitHub first:

```bash
git add .
git commit -m "feat/fix: describe your changes"
git push origin main
```

---

### Step 2: Update Live Service on VPS

You have three convenient ways to deploy to the VPS:

#### Option A: One-liner Script (Recommended)
Run the project's deploy script from the repository root:
```bash
./deploy.sh
```
This automatically verifies git push, pulls the latest code on the VPS, restarts `hats-db.service`, and checks the public health endpoint.

---

#### Option B: Using the `ocean` Command in Fish Shell
1. Launch fish shell and run the `ocean` command:
   ```fish
   ocean
   ```
2. Once connected to the remote VPS terminal (`root@illumi`), run:
   ```bash
   cd /root/services/hats_db
   git pull origin main
   systemctl restart hats-db.service
   systemctl status hats-db.service --no-pager
   ```
3. Exit when finished:
   ```bash
   exit
   ```

---

#### Option C: Non-interactive SSH One-liner (From Bash or Fish)
If running inside an automated task or shell without entering interactive SSH:
```bash
ssh -i ~/ocean/ocean root@167.172.60.237 "cd /root/services/hats_db && git pull origin main && systemctl restart hats-db.service && systemctl status hats-db.service --no-pager"
```

---

### Step 3: Verify Live Deployment

1. **Verify public health check**:
   ```bash
   curl -sS https://hats.rabii.duckdns.org/api/health
   # Expected response: {"message":"API is healthy.","code":200,"data":{}}
   ```

2. **Inspect live service logs**:
   ```bash
   ssh -i ~/ocean/ocean root@167.172.60.237 "journalctl -u hats-db.service -n 50 --no-pager"
   ```

---

## Important Operational Notes

- **Database Migrations (`pb_migrations/`)**:
  PocketBase automatically applies pending migrations when `hats-db.service` restarts.
- **Environment Variables**:
  Stored in `/root/services/hats_db/.env` (mode 600, gitignored).
- **Git Sync Conflicts**:
  If remote has untracked or local changes preventing `git pull`, run:
  ```bash
  ssh -i ~/ocean/ocean root@167.172.60.237 "cd /root/services/hats_db && git reset --hard origin/main && systemctl restart hats-db.service"
  ```
- **Caddy Service**:
  Managed via `systemctl status caddy` or `systemctl restart caddy`. Configuration file is at `/etc/caddy/Caddyfile`.
