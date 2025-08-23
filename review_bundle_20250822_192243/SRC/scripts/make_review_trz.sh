#!/usr/bin/env bash
set -euo pipefail

# Run from repo root
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

# Ensure the existing bundle script is executable then run it
if [ -f "scripts/make_review_bundle.sh" ]; then
  chmod +x "scripts/make_review_bundle.sh" 2>/dev/null || true
  ./scripts/make_review_bundle.sh
else
  echo "ERROR: scripts/make_review_bundle.sh not found" >&2
  exit 1
fi

# Find the newest .tgz in review_artifacts and create a .trz copy
mkdir -p review_artifacts
LATEST_TGZ="$(ls -1t review_artifacts/*.tgz 2>/dev/null | head -n1 || true)"

if [ -z "$LATEST_TGZ" ]; then
  echo "ERROR: no .tgz artifact found in review_artifacts/" >&2
  exit 1
fi

TRZ_PATH="${LATEST_TGZ%.tgz}.trz"
cp -f "$LATEST_TGZ" "$TRZ_PATH"
echo "Created .trz: $TRZ_PATH"
