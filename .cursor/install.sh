#!/usr/bin/env bash
# Durable, idempotent repository setup for the Cadence / Goalmaxxing dev environment.
# Runs once after the repo is checked out (and bakes into the environment build snapshot).
# Per-boot runtime services (Docker daemon, Supabase stack, dev server) live in start.sh.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# --- System packages -------------------------------------------------------
# The local Supabase stack runs in Docker. This is a nested container, so the
# default overlay2 storage driver cannot mount overlay-on-overlay; fuse-overlayfs
# is used instead (configured in start.sh via /etc/docker/daemon.json).
if ! command -v docker >/dev/null 2>&1 || ! command -v fuse-overlayfs >/dev/null 2>&1; then
  echo "[install] Installing docker.io + fuse-overlayfs..."
  sudo apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y -qq docker.io fuse-overlayfs
fi

# Let the unprivileged user talk to the Docker socket without sudo.
sudo groupadd -f docker
sudo usermod -aG docker "$(id -un)" || true

# --- Node dependencies -----------------------------------------------------
echo "[install] Installing Node dependencies with pnpm..."
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

echo "[install] Done."
