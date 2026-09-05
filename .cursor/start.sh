#!/usr/bin/env bash
# Per-boot runtime bring-up for the Cadence / Goalmaxxing dev environment.
# Starts the Docker daemon, the local Supabase stack, and writes .env.local.
# Must be idempotent and must return once services are healthy (the dev server
# itself runs as a persistent terminal, not here).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# --- Docker daemon ---------------------------------------------------------
# Configure fuse-overlayfs so containers can mount inside this nested container.
sudo mkdir -p /etc/docker
echo '{ "storage-driver": "fuse-overlayfs" }' | sudo tee /etc/docker/daemon.json >/dev/null

if ! sudo docker info >/dev/null 2>&1; then
  echo "[start] Starting dockerd..."
  sudo bash -c 'nohup dockerd >/tmp/dockerd.log 2>&1 &'
  for _ in $(seq 1 30); do
    sudo docker info >/dev/null 2>&1 && break
    sleep 1
  done
fi
sudo chmod 666 /var/run/docker.sock 2>/dev/null || true

# Same-bridge container-to-container traffic is dropped by bridge netfilter in
# this nested environment; disabling it lets the Supabase containers reach the DB.
sudo sysctl -w net.bridge.bridge-nf-call-iptables=0 >/dev/null 2>&1 || true
sudo sysctl -w net.bridge.bridge-nf-call-ip6tables=0 >/dev/null 2>&1 || true

# --- Supabase stack --------------------------------------------------------
# edge-runtime (Supabase Edge Functions) is excluded: this app uses Next.js API
# routes, not Supabase Edge Functions, and its health check is flaky in DinD.
if ! pnpm exec supabase status >/dev/null 2>&1; then
  echo "[start] Starting Supabase local stack (this pulls images on first boot)..."
  pnpm exec supabase start -x edge-runtime
fi

# --- App environment file --------------------------------------------------
if [ ! -f .env.local ]; then
  echo "[start] Writing .env.local from local Supabase credentials..."
  eval "$(pnpm exec supabase status -o env)"
  VAPID_JSON="$(pnpm exec web-push generate-vapid-keys --json)"
  VAPID_PUBLIC="$(printf '%s' "$VAPID_JSON" | sed -n 's/.*"publicKey":"\([^"]*\)".*/\1/p')"
  VAPID_PRIVATE="$(printf '%s' "$VAPID_JSON" | sed -n 's/.*"privateKey":"\([^"]*\)".*/\1/p')"
  cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${PUBLISHABLE_KEY}
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SECRET_KEY=${SECRET_KEY}
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${VAPID_PUBLIC}
VAPID_PRIVATE_KEY=${VAPID_PRIVATE}
VAPID_SUBJECT=mailto:dev@example.com
CRON_SECRET=$(openssl rand -hex 32)
EOF
fi

echo "[start] Ready. Supabase is up; the dev server runs in the 'next-dev' terminal."
