#!/usr/bin/env bash
# Seed the running Neo4j container with the recipe fixture.
#
# Idempotent — `MERGE` and `CREATE CONSTRAINT IF NOT EXISTS` in seed.cypher
# mean repeat runs do not duplicate nodes.
#
# Usage: bash scripts/seed_neo4j.sh (from repo root with stack running)

set -euo pipefail

# Auto-load .env if present, so the caller does not need to `source .env`
# manually before running this script.
set -a
[ -f .env ] && . ./.env
set +a

NEO4J_USER="${NEO4J_USER:-neo4j}"
NEO4J_PASSWORD="${NEO4J_PASSWORD:-devpassword}"

# Verify seed.cypher exists
if [ ! -f "api/seed.cypher" ]; then
  echo "Error: api/seed.cypher not found. Run this script from the repo root."
  exit 1
fi

# Pipe seed.cypher into neo4j via docker compose exec
echo "Seeding Neo4j with recipe fixture..."
docker compose exec -T neo4j cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" < api/seed.cypher

echo "✓ Neo4j seeded successfully"