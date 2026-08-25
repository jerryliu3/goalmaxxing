#!/usr/bin/env bash
set -euo pipefail

if docker info >/dev/null 2>&1; then
  echo "Docker is already running."
  exit 0
fi

echo "Docker is not running; attempting to start Docker Desktop..."
open -ga Docker

for attempt in $(seq 1 60); do
  if docker info >/dev/null 2>&1; then
    echo "Docker became available after ${attempt} check(s)."
    exit 0
  fi
  sleep 2
done

echo "::error::Docker daemon did not become available within 120s. Start Docker Desktop on the self-hosted runner."
exit 1
