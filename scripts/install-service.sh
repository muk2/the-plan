#!/bin/bash
# Installs The Plan as a macOS launchd service
# Usage: ./scripts/install-service.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PLIST_NAME="com.theplan.server"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_NAME}.plist"
BINARY="$PROJECT_DIR/backend/target/release/the-plan-backend"
FRONTEND="$PROJECT_DIR/frontend/dist"
LOG_DIR="$PROJECT_DIR/logs"

# Ensure built
if [ ! -f "$BINARY" ]; then
  echo "Binary not found. Building..."
  cd "$PROJECT_DIR" && make build
fi

mkdir -p "$LOG_DIR"
mkdir -p "$HOME/Library/LaunchAgents"

# Unload if already installed
launchctl unload "$PLIST_PATH" 2>/dev/null || true

cat > "$PLIST_PATH" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${BINARY}</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        <key>FRONTEND_DIR</key>
        <string>${FRONTEND}</string>
        <key>PORT</key>
        <string>3000</string>
    </dict>
    <key>WorkingDirectory</key>
    <string>${PROJECT_DIR}/backend</string>
    <key>RunAtLoad</key>
    <false/>
    <key>KeepAlive</key>
    <false/>
    <key>StandardOutPath</key>
    <string>${LOG_DIR}/server.log</string>
    <key>StandardErrorPath</key>
    <string>${LOG_DIR}/server.log</string>
</dict>
</plist>
EOF

echo "Service installed at $PLIST_PATH"
echo ""
echo "Commands:"
echo "  Start:   launchctl load $PLIST_PATH"
echo "  Stop:    launchctl unload $PLIST_PATH"
echo "  Logs:    tail -f $LOG_DIR/server.log"
echo ""
echo "Or use the shortcuts:"
echo "  make service-start"
echo "  make service-stop"
echo "  make service-logs"
