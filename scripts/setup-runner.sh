#!/bin/bash
# Sets up a GitHub Actions self-hosted runner on your Mac Mini.
# Run this once on your Mac Mini to enable automatic deployments.
#
# Prerequisites:
#   - Rust installed (curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh)
#   - Node.js installed (brew install node)
#   - GitHub CLI authenticated (gh auth login)
#
# Usage: ./scripts/setup-runner.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUNNER_DIR="$PROJECT_DIR/.github-runner"

echo "=== GitHub Actions Self-Hosted Runner Setup ==="
echo ""

# Check prerequisites
echo "Checking prerequisites..."
command -v cargo >/dev/null 2>&1 || { echo "ERROR: Rust not installed. Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: Node.js not installed. Run: brew install node"; exit 1; }
command -v gh >/dev/null 2>&1 || { echo "ERROR: GitHub CLI not installed. Run: brew install gh"; exit 1; }
echo "All prerequisites found."
echo ""

# Get runner token from GitHub
echo "Getting runner registration token..."
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null)
if [ -z "$REPO" ]; then
  echo "ERROR: Could not determine repo. Make sure you're in the project directory and gh is authenticated."
  exit 1
fi
echo "Repository: $REPO"

TOKEN=$(gh api "repos/${REPO}/actions/runners/registration-token" --method POST -q .token 2>/dev/null)
if [ -z "$TOKEN" ]; then
  echo "ERROR: Could not get runner token. Make sure you have admin access to the repo."
  exit 1
fi

# Determine architecture
ARCH=$(uname -m)
case "$ARCH" in
  arm64) RUNNER_ARCH="osx-arm64" ;;
  x86_64) RUNNER_ARCH="osx-x64" ;;
  *) echo "ERROR: Unsupported architecture: $ARCH"; exit 1 ;;
esac

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
RUNNER_VERSION="2.322.0"

echo ""
echo "Platform: ${OS}-${ARCH} (runner: ${RUNNER_ARCH})"
echo ""

# Download and extract runner
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

if [ ! -f "./config.sh" ]; then
  RUNNER_TAR="actions-runner-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
  RUNNER_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_TAR}"

  echo "Downloading runner v${RUNNER_VERSION}..."
  curl -sL "$RUNNER_URL" -o "$RUNNER_TAR"
  echo "Extracting..."
  tar xzf "$RUNNER_TAR"
  rm -f "$RUNNER_TAR"
fi

# Configure runner
echo ""
echo "Configuring runner..."
./config.sh \
  --url "https://github.com/${REPO}" \
  --token "$TOKEN" \
  --name "mac-mini" \
  --labels "self-hosted,macOS,ARM64" \
  --work "_work" \
  --replace

# Install as a service (runs in background, survives reboots)
echo ""
echo "Installing runner as a service..."
./svc.sh install
./svc.sh start

echo ""
echo "=== Setup Complete ==="
echo ""
echo "The runner is now active and will pick up deploy jobs."
echo "You can check its status at:"
echo "  https://github.com/${REPO}/settings/actions/runners"
echo ""
echo "Runner commands:"
echo "  Start:   cd $RUNNER_DIR && ./svc.sh start"
echo "  Stop:    cd $RUNNER_DIR && ./svc.sh stop"
echo "  Status:  cd $RUNNER_DIR && ./svc.sh status"
echo ""
echo "=== How deployment works ==="
echo "1. Create a PR on GitHub"
echo "2. CI runs automatically to validate the build"
echo "3. Merge the PR to main"
echo "4. Deploy workflow runs on this Mac Mini"
echo "5. App is rebuilt and restarted automatically"
