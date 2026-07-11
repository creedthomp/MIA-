#!/bin/bash
set -e

export PATH="$HOME/.local/share/supabase:$HOME/.local/bin:$HOME/.bun/bin:$PATH"
export DOCKER_HOST="unix://$HOME/.colima/default/docker.sock"

CMD=$1

case $CMD in
  start)
    echo "→ starting supabase local stack..."
    supabase start
    ;;
  stop)
    echo "→ stopping supabase..."
    supabase stop
    ;;
  status)
    supabase status
    ;;
  types)
    echo "→ regenerating types/supabase.ts from local DB..."
    SUPABASE_ACCESS_TOKEN=local supabase gen types typescript --local > types/supabase.ts
    echo "  done → types/supabase.ts"
    ;;
  push)
    echo "→ pushing migrations to remote (cloud) supabase..."
    supabase db push
    ;;
  *)
    echo "usage: bun run sb:{start|stop|status|types|push}"
    exit 1
    ;;
esac
