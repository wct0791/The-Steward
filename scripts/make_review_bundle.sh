#!/usr/bin/env bash

set -euo pipefail

# Resolve repo root (fallback to current dir) and ensure we run from there
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

# Where to place final artifacts
ARTIFACTS_DIR="$REPO_ROOT/review_artifacts"
mkdir -p "$ARTIFACTS_DIR"

BUNDLE_ROOT="review_bundle_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BUNDLE_ROOT"/{SRC,CONFIG,REPORTS,DIFFS}

# 1) Basic metadata
cp -f package.json "$BUNDLE_ROOT/CONFIG/" 2>/dev/null || true
cp -f package-lock.json "$BUNDLE_ROOT/CONFIG/" 2>/dev/null || true
cp -f pnpm-lock.yaml "$BUNDLE_ROOT/CONFIG/" 2>/dev/null || true
cp -f yarn.lock "$BUNDLE_ROOT/CONFIG/" 2>/dev/null || true
cp -f README* "$BUNDLE_ROOT/CONFIG/" 2>/dev/null || true

# Common config files
for f in .eslintrc* .prettierrc* tsconfig*.json jsconfig*.json vite.config.* next.config.* astro.config.* \
         docker-compose.* Dockerfile .nvmrc .node-version .browserslistrc .npmrc
do
  cp -f $f "$BUNDLE_ROOT/CONFIG/" 2>/dev/null || true
done

# 2) Copy key source dirs if they exist (adjust as needed for The Steward)
for d in src app components server backend api lib utils hooks routes mcp workflows docker scripts .github/workflows
do
  if [ -d "$d" ]; then
    rsync -a --exclude='.env*' --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='build' \
      "$d" "$BUNDLE_ROOT/SRC/" 2>/dev/null || true
  fi
done

# 3) Reports (best-effort; tolerate missing tools)
node -v > "$BUNDLE_ROOT/REPORTS/node_version.txt" 2>/dev/null || true
npm -v  > "$BUNDLE_ROOT/REPORTS/npm_version.txt"  2>/dev/null || true

npm ls --depth=0 > "$BUNDLE_ROOT/REPORTS/dependencies.txt" 2>/dev/null || true
npx depcheck > "$BUNDLE_ROOT/REPORTS/depcheck.txt" 2>/dev/null || true
npm audit --production --json > "$BUNDLE_ROOT/REPORTS/npm_audit.json" 2>/dev/null || true

npx eslint . -f stylish > "$BUNDLE_ROOT/REPORTS/eslint.txt" 2>/dev/null || true
npx jest --passWithNoTests --reporters=default --coverage=false > "$BUNDLE_ROOT/REPORTS/jest.txt" 2>/dev/null || true
npx tsc --noEmit > "$BUNDLE_ROOT/REPORTS/tsc.txt" 2>/dev/null || true

git status -sb > "$BUNDLE_ROOT/REPORTS/git_status.txt" 2>/dev/null || true
git log --oneline -n 30 > "$BUNDLE_ROOT/REPORTS/git_log_last30.txt" 2>/dev/null || true

# 4) Diffs (branch names are guesses; tweak if yours differ)
git rev-parse --abbrev-ref HEAD > "$BUNDLE_ROOT/REPORTS/current_branch.txt" 2>/dev/null || true
git diff --staged      > "$BUNDLE_ROOT/DIFFS/staged.patch" 2>/dev/null || true
git diff main...HEAD   > "$BUNDLE_ROOT/DIFFS/feature_vs_main.patch" 2>/dev/null || true

# 5) Secret sweep (heuristic; you still must review!)
if command -v rg >/dev/null 2>&1; then
  rg -n --hidden -g '!*' -e '(sk-[A-Za-z0-9]{20,})|api[_-]?key|token|secret|authorization' \
    > "$BUNDLE_ROOT/REPORTS/possible_secrets.txt" || true
fi

# 6) Add a prompt for the reviewer
cat > "$BUNDLE_ROOT/REVIEW_NOTES.md" <<'EOF'
# Review Notes (fill before uploading)
Context:
- App area(s) to review:
- Architectural question(s):
- Pain points/bugs to focus on:
- Intended behavior (brief):

Risks to watch:
- Security/config:
- Concurrency/race conditions:
- Error handling/fallbacks:

Goals for this review:
- e.g., “Validate router fallback logic with n8n MCP timeouts”
EOF

# Show bundle directory and check existence
echo "Bundle directory: $(pwd)/$BUNDLE_ROOT"
[ -d "$BUNDLE_ROOT" ] || { echo "ERROR: Bundle directory not found" >&2; exit 1; }

TAR_NAME="Steward_Review_$(date +%Y%m%d_%H%M).tgz"
TAR_PATH="$ARTIFACTS_DIR/$TAR_NAME"

tar -czf "$TAR_PATH" "$BUNDLE_ROOT"
echo "Created: $TAR_PATH"
