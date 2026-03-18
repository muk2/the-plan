#!/bin/bash
# Deploy script — stops the running server, swaps the binary, restarts.
# Called by GitHub Actions deploy workflow on the self-hosted runner.
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PID_FILE="$PROJECT_DIR/.server.pid"
BINARY="$PROJECT_DIR/backend/target/release/the-plan-backend"
FRONTEND="$PROJECT_DIR/frontend/dist"
LOG_DIR="$PROJECT_DIR/logs"

echo "=== Deploying The Plan ==="
echo "Project: $PROJECT_DIR"
echo "Time:    $(date)"

# 1. Stop current server
if [ -f "$PID_FILE" ]; then
  PID=$(cat "$PID_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "Stopping server (PID $PID)..."
    kill "$PID"
    # Wait for graceful shutdown (up to 10s)
    for i in $(seq 1 10); do
      kill -0 "$PID" 2>/dev/null || break
      sleep 1
    done
    # Force kill if still alive
    kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null
    echo "Server stopped."
  else
    echo "Stale PID file, cleaning up."
  fi
  rm -f "$PID_FILE"
else
  # Try to find and kill any running instance
  pkill -f the-plan-backend 2>/dev/null && echo "Stopped orphan process." || true
  sleep 1
fi

# 2. Verify binary exists
if [ ! -f "$BINARY" ]; then
  echo "ERROR: Binary not found at $BINARY"
  exit 1
fi

if [ ! -d "$FRONTEND" ]; then
  echo "ERROR: Frontend dist not found at $FRONTEND"
  exit 1
fi

# 3. Start new server
mkdir -p "$LOG_DIR" "$PROJECT_DIR/data"

echo "Starting server..."
DATABASE_PATH="$PROJECT_DIR/data/theplan.db" \
  FRONTEND_DIR="$FRONTEND" \
  PORT=3000 \
  nohup "$BINARY" >> "$LOG_DIR/server.log" 2>&1 &

echo $! > "$PID_FILE"
sleep 2

# 4. Health check
if kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
  echo "=== Deploy successful ==="
  echo "PID: $(cat "$PID_FILE")"
  echo "URL: http://localhost:3000"

  # Try to get Tailscale IP
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
