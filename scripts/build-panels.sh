#!/usr/bin/env bash
set -euo pipefail

echo "Building MCP panels..."

PANEL_DIRS=(
  "command-center-dashboard"
  "live-room"
  "earnings-page"
  "creator-studio"
  "discover-feed"
  "domino-arena"
)

for panel in "${PANEL_DIRS[@]}"; do
  echo "- building $panel"
  pushd "mcp/apps/$panel" > /dev/null
  npm install
  npm run build
  # assume build outputs dist/index.html as single file
  cp dist/index.html ../../resources/${panel}.html
  popd > /dev/null
done

echo "Panels built."
