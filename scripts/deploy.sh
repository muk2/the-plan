#!/bin/bash
# Deploy script — copies built artifacts to deploy dir, restarts server.
# Called by GitHub Actions deploy workflow on the self-hosted runner.
#
# The runner builds in its own work directory. This script copies the
# binary + frontend dist to a fixed deploy location, then starts the
# server fully detached so the runner cleanup doesn't kill it.
set -e

# Where the runner built everything (current checkout)
BUILD_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Fixed deploy location — outside the runner's work tree
DEPLOY_DIR="${DEPLOY_DIR:-$HOME/the-plan-deploy}"
PID_FILE="$DEPLOY_DIR/.server.pid"
LOG_DIR="$DEPLOY_DIR/logs"
DATA_DIR="$DEPLOY_DIR/data"

echo "=== Deploying The Plan ==="
echo "Build:   $BUILD_DIR"
echo "Deploy:  $DEPLOY_DIR"
echo "Time:    $(date)"

# 1. Stop current server
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "Stopping server (PID $PID)..."
    kill "$PID"
    for i in $(seq 1 10); do
      kill -0 "$PID" 2>/dev/null || break
      sleep 1
    done
    kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null
    echo "Server stopped."
  else
    echo "Stale PID file, cleaning up."
  fi
  rm -f "$PID_FILE"
else
  pkill -f the-plan-backend 2>/dev/null && echo "Stopped orphan process." || true
  sleep 1
fi

# 2. Verify build artifacts exist
BINARY="$BUILD_DIR/backend/target/release/the-plan-backend"
FRONTEND="$BUILD_DIR/frontend/dist"

if [ ! -f "$BINARY" ]; then
  echo "ERROR: Binary not found at $BINARY"
  exit 1
fi

if [ ! -d "$FRONTEND" ]; then
  echo "ERROR: Frontend dist not found at $FRONTEND"
  exit 1
fi

# 3. Copy artifacts to deploy directory
mkdir -p "$DEPLOY_DIR/bin" "$DEPLOY_DIR/frontend" "$LOG_DIR" "$DATA_DIR"

echo "Copying binary..."
cp "$BINARY" "$DEPLOY_DIR/bin/the-plan-backend"

echo "Copying frontend..."
rm -rf "$DEPLOY_DIR/frontend/dist"
cp -r "$FRONTEND" "$DEPLOY_DIR/frontend/dist"

# 4. Start server fully detached from runner process group
echo "Starting server..."
setsid bash -c "
  DATABASE_PATH='$DATA_DIR/theplan.db' \
  FRONTEND_DIR='$DEPLOY_DIR/frontend/dist' \
  PORT=3000 \
  nohup '$DEPLOY_DIR/bin/the-plan-backend' >> '$LOG_DIR/server.log' 2>&1 &
  echo \$! > '$PID_FILE'
"

sleep 2

# 5. Health check
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "=== Deploy successful ==="
  echo "PID: $(cat "$PID_FILE")"
  echo "URL: http://localhost:3000"

  if command -v tailscale &>/dev/null; then
    TS_IP=$(tailscale ip -4 2>/dev/null || true)
    [ -n "$TS_IP" ] && echo "Tailscale: http://${TS_IP}:3000"
  fi
else
  echo "=== Deploy FAILED ==="
  echo "Server did not start. Last 20 lines of log:"
  tail -20 "$LOG_DIR/server.log" 2>/dev/null || true
  rm -f "$PID_FILE"
  exit 1
fi
