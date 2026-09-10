# Hats DB (PocketBase Backend)

PocketBase backend service for the **Hats** e-commerce application.

---

## 1. Quick Reference & Commands

- **Local Server**: `./run.sh` (exports `.env` and runs `./pocketbase serve` on `http://127.0.0.1:8090`)
- **Package Manager**: `bun` (`bun install`)
- **Admin UI**: `http://127.0.0.1:8090/_/`
- **Type Generation**: `bunx pocketbase-typegen --db ./pb_data/data.db --out ./pocketbase-types.ts`
- **Full Deployment Guide**: See [DEPLOYMENT.md](file:///home/destiny/Documents/projects/hats_db/DEPLOYMENT.md)

---

## 2. Production Deployment (DigitalOcean)

- **Droplet IP**: `167.172.60.237` (Host user: `root`)
- **SSH Access**: `ssh -i ~/ocean/ocean root@167.172.60.237` (or Fish shell command `ocean`)
- **Remote App Path**: `/root/services/hats_db`
- **Reverse Proxy**: Caddy (`/etc/caddy/Caddyfile`) routing `hats.rabii.duckdns.org` & `rabii.duckdns.org` -> `localhost:8090`
- **Systemd Service**: `hats-db.service` (`/etc/systemd/system/hats-db.service`)
  - Loads environment from `/root/services/hats_db/.env` (`EnvironmentFile=-/root/services/hats_db/.env`)
  - Working directory: `/root/services/hats_db`
- **Deploying Updates (Standard Workflow)**:
  1. **Push to Git**:
     ```bash
     git add .
     git commit -m "feat/fix: describe changes"
     git push origin main
     ```
  2. **Push to Live VPS**:
     - **Option 1 (Automated script)**: `./deploy.sh`
     - **Option 2 (Fish shell command)**:
       ```fish
       ocean
       # Once connected to VPS:
       cd /root/services/hats_db
       git pull origin main
       systemctl restart hats-db.service
       ```
     - **Option 3 (SSH one-liner)**:
       ```bash
       ssh -i ~/ocean/ocean root@167.172.60.237 "cd /root/services/hats_db && git pull origin main && systemctl restart hats-db.service"
       ```
  3. **Verify Live Health**:
     ```bash
     curl -sS https://hats.rabii.duckdns.org/api/health
     ```

- **Common Service Operations**:

  ```bash
  # View service status and live logs
  systemctl status hats-db.service
  journalctl -u hats-db.service -f --no-pager

  # Restart after updates
  systemctl restart hats-db.service
  ```

---

## 3. Environment Variables

Store in `.env` (gitignored, chmod 600 in production):

| Variable          | Description                                                                                                           |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| `PAYSTACK_SECRET` | Paystack secret key (`sk_test_...` or `sk_live_...`). Required for checkout initialization, validation, and webhooks. |

---

## 4. Architecture & Directory Layout

- **`pb_hooks/`** (PocketBase JS/TS runtime hooks):
  - `payments.pb.ts`: Custom endpoints (`POST /checkout`, `POST /checkout/validate`, `POST /paystack/webhook`) and cron job (`reconcile-checkouts` every 20m). Note: handlers are protected with `$apis.requireAuth()`.
  - `cart.pb.ts`: `GET /cart/breakdown` (distance-based delivery and total pricing calculation), cart validation.
  - `auth.pb.ts`: User registration (`POST /register`), delivery profile management (`GET /delivery/me/{id}`, `POST /delivery/`).
  - `products.pb.ts`: Product validation, stock tracking, category hooks.
  - `reviews.pb.ts`: Review submissions and rating aggregations.
  - `orders.pb.ts`: Order creation hooks and post-processing.
  - `utils.js`: Core helpers:
    - `paystack_secret()`, `paystack_initialize()`, `paystack_verify()`
    - `build_cart_items()`
    - `calculate_delivery_fee()` (distance calculation using Haversine formula against `shop_location` collection, rate per km with minimum fee threshold)
    - `fulfill_order()` (transactional order creation from session and cart items)
- **`pb_migrations/`**: PocketBase schema and database migrations.
- **`pb_data/`**:
  - `data.db`: SQLite database for collections and records.
  - `auxiliary.db`: Contains request logs (`_logs` table) useful for debugging failed requests.
