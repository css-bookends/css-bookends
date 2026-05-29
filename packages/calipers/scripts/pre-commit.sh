#!/usr/bin/env bash

set -euo pipefail

branch="$(git rev-parse --abbrev-ref HEAD)"

# Only enforce on main-like branches; allow free commits elsewhere.
if [ "$branch" != "main" ] && [ "$branch" != "master" ]; then
  exit 0
fi

echo
echo "🔒 pre-commit: running full check pipeline on branch '$branch'..."
echo

npm run test:core
npm run build
npm run test:dist
npm run test:types

echo
echo "✅ pre-commit checks passed; proceeding with commit."
echo

