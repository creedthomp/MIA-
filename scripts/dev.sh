#!/bin/bash
set -e

export PATH="$HOME/.local/share/supabase:$HOME/.local/bin:$HOME/.bun/bin:$PATH"
export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"

# Load .env.local so config.toml env() substitution (e.g. Google OAuth) resolves
if [ -f .env.local ]; then
  set -a; . ./.env.local; set +a
fi

echo ""
echo "── Mia Dev ──────────────────────────────"

# 1. Colima (Docker VM)
if colima status 2>&1 | grep -q "Running"; then
  echo "  colima       already running"
else
  echo "→ starting colima (this takes ~30s)..."
  colima start
  echo "  colima       ready"
fi

# 2. Supabase local stack
echo "→ starting supabase..."
supabase start
echo "  supabase     ready"

# 3. Expo dev server
echo ""
echo "→ starting expo..."
echo "─────────────────────────────────────────"
echo ""
bun start
