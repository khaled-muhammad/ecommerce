#!/usr/bin/env bash
# Create PostgreSQL role + database for local dev (macOS + Linux).
# Defaults match backend/.env.example: postgresql://postgres:postgres@localhost:5432/roxy
#
# Usage:
#   ./scripts/setup-db.sh
#   DB_USER=myuser DB_PASSWORD=secret DB_NAME=myapp ./scripts/setup-db.sh
#   PG_ADMIN_USER=postgres PG_ADMIN_PASSWORD=... ./scripts/setup-db.sh
#
# If connection fails: Homebrew Postgres often uses your macOS user as superuser:
#   PG_ADMIN_USER=$USER ./scripts/setup-db.sh
# Debian/Ubuntu typical pattern:
#   sudo -u postgres env PG_ADMIN_USER=postgres ./scripts/setup-db.sh

set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
DB_NAME="${DB_NAME:-roxy}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# Superuser for DDL (create role / database). Leave unset to try postgres, then $USER.
PG_ADMIN_USER="${PG_ADMIN_USER:-}"
PG_ADMIN_PASSWORD="${PG_ADMIN_PASSWORD:-}"
PG_ADMIN_DB="${PG_ADMIN_DB:-postgres}"

die() {
  echo "error: $*" >&2
  exit 1
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "missing command '$1' - install PostgreSQL client (psql)"
}

validate_ident() {
  local n="$1" kind="$2"
  [[ "$n" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]] || die "invalid $kind '$n' (use letters, numbers, underscore only)"
}

validate_ident "$DB_NAME" "DB_NAME"
validate_ident "$DB_USER" "DB_USER"

# Escape for use inside a PostgreSQL single-quoted string literal (double ')
sql_escape_literal() {
  printf '%s' "$1" | sed "s/'/''/g"
}

admin_psql() {
  export PGPASSWORD="${PG_ADMIN_PASSWORD}"
  # shellcheck disable=SC2068
  psql -h "$PGHOST" -p "$PGPORT" -U "$PG_ADMIN_USER" -v ON_ERROR_STOP=1 "$@"
  unset PGPASSWORD
}

try_admin() {
  local u="$1"
  PGPASSWORD="${PG_ADMIN_PASSWORD}" psql -h "$PGHOST" -p "$PGPORT" -U "$u" -d "$PG_ADMIN_DB" -c "SELECT 1" >/dev/null 2>&1
}

detect_admin() {
  if [[ -n "$PG_ADMIN_USER" ]]; then
    try_admin "$PG_ADMIN_USER" || die "cannot connect as PG_ADMIN_USER=$PG_ADMIN_USER to $PGHOST:$PGPORT (set PG_ADMIN_PASSWORD if required)"
    return
  fi
  for u in postgres "$USER"; do
    if try_admin "$u"; then
      PG_ADMIN_USER="$u"
      echo "Using superuser: $PG_ADMIN_USER"
      return
    fi
  done
  die "could not connect as 'postgres' or '$USER'. Set PG_ADMIN_USER (and PG_ADMIN_PASSWORD). On Linux try: sudo -u postgres env PG_ADMIN_USER=postgres $0"
}

grant_db_and_schema() {
  admin_psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"${DB_NAME}\" TO \"${DB_USER}\";"

  admin_psql -d "$DB_NAME" <<SQL
ALTER SCHEMA public OWNER TO "${DB_USER}";
GRANT USAGE, CREATE ON SCHEMA public TO "${DB_USER}";
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "${DB_USER}";
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "${DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "${DB_USER}";
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "${DB_USER}";
SQL
}

main() {
  need_cmd psql
  detect_admin

  echo "Ensuring role '$DB_USER' exists (password set / updated)..."
  # psql does not expand :'var' inside DO $$ ... $$ - use shell-safe literals (DB_* validated; password escaped).
  local pw_lit
  pw_lit=$(sql_escape_literal "$DB_PASSWORD")
  admin_psql -d "$PG_ADMIN_DB" <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L', '${DB_USER}', '${pw_lit}');
  ELSE
    EXECUTE format('ALTER ROLE %I LOGIN PASSWORD %L', '${DB_USER}', '${pw_lit}');
  END IF;
END
\$\$;
SQL

  echo "Ensuring database '$DB_NAME' exists (owner: $DB_USER)..."
  local exists
  exists=$(PGPASSWORD="${PG_ADMIN_PASSWORD}" psql -h "$PGHOST" -p "$PGPORT" -U "$PG_ADMIN_USER" -d "$PG_ADMIN_DB" -tAc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | tr -d '[:space:]')

  if [[ "$exists" != "1" ]]; then
    admin_psql -d "$PG_ADMIN_DB" -c "CREATE DATABASE \"${DB_NAME}\" OWNER \"${DB_USER}\" ENCODING 'UTF8' TEMPLATE template0;"
  else
    echo "Database '$DB_NAME' already exists; syncing owner + privileges..."
    admin_psql -d "$PG_ADMIN_DB" -c "ALTER DATABASE \"${DB_NAME}\" OWNER TO \"${DB_USER}\";"
  fi

  grant_db_and_schema

  echo ""
  echo "Done. Set in backend/.env:"
  echo "  DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${PGHOST}:${PGPORT}/${DB_NAME}"
  echo ""
  echo "Then (from backend/):"
  echo "  npm run db:migrate   # apply SQL migrations (store_settings, contact_inquiries, …)"
  echo "  # or: npm run db:push  # sync schema without migration files (dev only)"
  echo "  npm run seed"
}

main "$@"
