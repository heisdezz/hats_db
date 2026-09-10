#!/usr/bin/env bash
set -e

echo "==> Pushing local changes to GitHub (origin/main)..."
git push origin main

echo "==> Pulling latest changes on DigitalOcean VPS..."
ssh -i ~/ocean/ocean root@167.172.60.237 "cd /root/services/hats_db && git pull origin main && systemctl restart hats-db.service && systemctl status hats-db.service --no-pager"

echo "==> Checking live health endpoint..."
curl -sS https://hats.rabii.duckdns.org/api/health
echo ""
echo "==> Deployment successful!"
