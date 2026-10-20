#!/usr/bin/env bash
#
# Air cloud startup script for trip-planner.
#
# trip-planner is a React 19 + TypeScript single-page app built with Vite.
# There is no backend, database, or external service: state lives in the
# browser's localStorage. So setup is just the JS toolchain:
#
#   1. install npm dependencies (slow, cacheable -> baked into the snapshot)
#   2. prime the TypeScript/Vite build caches with a production build
#   3. start the Vite dev server so the app is reachable through the exposed
#      port (5173)
#
# The script runs in two modes, announced via AIR_STARTUP_MODE:
#   warmup -> snapshot-baking run (env-setup verification runs in this mode);
#             we start the dev server and then block on healthcheck so the
#             finished install/build/caches land in the snapshot.
#   task   -> real task run; we start the dev server in the background and
#             return promptly so the user is not kept waiting.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_DIR"

if [ "${AIR_STARTUP_MODE:-}" = warmup ]; then WARMUP=1; else WARMUP=; fi

PORT=5173
DEV_LOG=/tmp/air-vite-dev.log
VITE_CONFIG=.air/cloud/vite.config.ts

log() { echo "[startup] $*"; }

# --- 1. Dependencies --------------------------------------------------------
log "Node $(node -v), npm $(npm -v)"
if [ -f package-lock.json ]; then
  log "Installing dependencies with 'npm ci'..."
  npm ci
else
  log "No package-lock.json; installing with 'npm install'..."
  npm install
fi
log "Dependencies installed."

# --- 2. Prime build caches --------------------------------------------------
# Runs tsc + vite build once so the first real task reuses warm caches.
# Non-fatal: a broken product build must not block environment setup.
log "Priming build caches with 'npm run build'..."
if npm run build; then
  log "Build cache primed."
else
  log "WARNING: 'npm run build' failed; continuing (dev server does not need it)."
fi

# --- 3. Dev server ----------------------------------------------------------
# Uses the env-setup Vite config so the proxy's Host header is accepted.
start_dev_server() {
  log "Starting Vite dev server on 0.0.0.0:${PORT}..."
  nohup npx vite --config "$VITE_CONFIG" --host 0.0.0.0 --port "$PORT" \
    > "$DEV_LOG" 2>&1 &
  log "Dev server launched (logs: ${DEV_LOG})."
}

# healthcheck: block until the dev server actually serves the app.
# Asserts an HTTP 200 AND that the response is the app's HTML (contains the
# React mount point), not just that the port is open. Keeps polling with no
# fixed deadline — the launch applies its own timeout. Exits non-zero only
# when the server process dies, which fails startup as required.
healthcheck() {
  log "Waiting for dev server to serve the app on port ${PORT}..."
  local attempt=0 body
  while true; do
    attempt=$((attempt + 1))
    if ! pgrep -f "vite --config $VITE_CONFIG" >/dev/null 2>&1; then
      log "ERROR: dev server process is not running. Recent log:"
      tail -n 30 "$DEV_LOG" || true
      return 1
    fi
    body="$(curl -fsS --max-time 5 "http://localhost:${PORT}/" 2>/dev/null || true)"
    if printf '%s' "$body" | grep -q 'id="root"'; then
      log "Dev server is healthy: serving app HTML on port ${PORT}."
      return 0
    fi
    if [ $((attempt % 10)) -eq 0 ]; then
      log "Still waiting for dev server (attempt ${attempt})..."
    fi
    sleep 2
  done
}

start_dev_server

if [ -n "${WARMUP:-}" ]; then
  healthcheck
else
  log "Task mode: dev server starting in background; startup complete."
fi

log "Startup finished."
