#!/usr/bin/env bash
# Air cloud startup script for trip-planner (Vite 8 + React 19 + TypeScript SPA).
set -euo pipefail

if [ "${AIR_STARTUP_MODE:-}" = warmup ]; then WARMUP=1; else WARMUP=; fi

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_DIR"

PORT=5173
DEV_LOG=/tmp/vite-dev.log
log() { echo "[startup] $*"; }

# --- Node.js (Vite 8 needs Node 20.19+ / 22.12+) ---------------------------
node_ok() {
  command -v node >/dev/null 2>&1 &&
    node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit((a>22||(a===22&&b>=12)||(a===20&&b>=19))?0:1)'
}
if node_ok; then
  log "Using Node $(node -v), npm $(npm -v)"
else
  log "Suitable Node.js not found; installing Node 22 via NodeSource"
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo -E apt-get install -y nodejs
  log "Installed Node $(node -v)"
fi

# --- Dependencies -----------------------------------------------------------
log "Installing npm dependencies (npm ci)..."
npm ci --no-audit --no-fund
log "Dependencies installed"

# --- Warmup-only: prime build caches and prove the toolchain works ----------
if [ -n "$WARMUP" ]; then
  log "Running lint..."
  npm run lint
  log "Running build (tsc -b && vite build)..."
  npm run build
  log "Build OK"
fi

# --- Dev server (background; reachable via exposed port $PORT) -------------
if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/" 2>/dev/null; then
  log "Dev server already listening on :$PORT"
else
  log "Starting Vite dev server on 0.0.0.0:$PORT (log: $DEV_LOG)"
  nohup npx vite --config .air/cloud/vite.air.config.ts >"$DEV_LOG" 2>&1 &
  disown || true
fi

healthcheck() {
  local n=0 body
  log "healthcheck: waiting for dev server on :$PORT"
  while :; do
    # Probe with a foreign Host header, as the exposed-port proxy does.
    if body=$(curl -fsS -H "Host: preview.example.air" "http://127.0.0.1:$PORT/" 2>/dev/null); then
      if grep -q 'id="root"' <<<"$body" && grep -q '/src/main.tsx' <<<"$body"; then
        if curl -fsS -o /dev/null -H "Host: preview.example.air" "http://127.0.0.1:$PORT/src/main.tsx"; then
          log "healthcheck: OK (index.html and /src/main.tsx served)"
          return 0
        fi
      else
        log "healthcheck: unexpected response from dev server:"
        head -c 500 <<<"$body"; echo
        return 1
      fi
    fi
    if ! pgrep -f "vite --config .air/cloud/vite.air.config.ts" >/dev/null; then
      log "healthcheck: dev server process is not running; last log lines:"
      tail -n 50 "$DEV_LOG" || true
      return 1
    fi
    n=$((n + 1))
    if [ $((n % 10)) -eq 0 ]; then log "healthcheck: still waiting ($n s)..."; fi
    sleep 1
  done
}

if [ -n "$WARMUP" ]; then healthcheck; fi
log "Startup complete"
