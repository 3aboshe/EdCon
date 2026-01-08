#!/usr/bin/env bash
set -euo pipefail

SERVER_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_HEALTH_URL="${API_HEALTH_URL:-https://edcon-production.up.railway.app/api/health}"
SEED_CONFIRMATION="${SEED_CONFIRMATION:-ask}"

log() {
  printf "[railway-maintenance] %s\n" "$1"
}

die() {
  printf "[railway-maintenance][error] %s\n" "$1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Missing required command: $1"
}

confirm_seed() {
  if [[ "$SEED_CONFIRMATION" == "yes" ]]; then
    return 0
  elif [[ "$SEED_CONFIRMATION" == "no" ]]; then
    return 1
  fi

  read -r -p "Seed the Railway database? This will overwrite demo data. [y/N] " reply
  [[ "$reply" == "y" || "$reply" == "Y" ]]
}

require_cmd npm
require_cmd npx
require_cmd curl
require_cmd jq

EFFECTIVE_DB_URL="${DATABASE_PROXY_URL:-${DATABASE_PUBLIC_URL:-${DATABASE_URL:-}}}"
if [[ -z "$EFFECTIVE_DB_URL" ]]; then
  die "Set DATABASE_PROXY_URL (preferred) or DATABASE_URL to your Railway public Postgres connection string before running this script."
fi

if [[ "$EFFECTIVE_DB_URL" == *"postgres.railway.internal"* ]]; then
  die "The provided database URL points to the internal host. Please supply the Railway public proxy URL (turntable.proxy...)."
fi

cd "$SERVER_DIR"

log "Running Prisma migrate deploy against Railway..."
DATABASE_URL="$EFFECTIVE_DB_URL" npx prisma migrate deploy --schema prisma/schema.prisma

if confirm_seed; then
  log "Seeding Railway database (npm run seed)..."
  DATABASE_URL="$EFFECTIVE_DB_URL" npm run seed
else
  log "Skipping seed step. Set SEED_CONFIRMATION=yes to auto-run."
fi

log "Checking API health endpoint: $API_HEALTH_URL"
if curl --fail --silent "$API_HEALTH_URL" | jq '.' 2>/dev/null; then
  log "API health JSON parsed successfully."
else
  log "Health endpoint did not return JSON or request failed. Showing raw output:"
  curl -i "$API_HEALTH_URL" || true
fi

log "Done."
