#!/usr/bin/env bash
# Seed the running Neo4j container with the recipe fixture.
#
# Idempotent — `MERGE` and `CREATE CONSTRAINT IF NOT EXISTS` in seed.cypher
# mean repeat runs do not duplicate nodes.
#
# Usage: bash scripts/seed_neo4j.sh (from repo root with stack running)

set -euo pipefail

# Verify required env vars
if [ -z "${NEO4J_USER:-}" ]; then
  echo "Error: NEO4J_USER not set. Load .env first: source .env"
  exit 1
fi

if [ -z "${NEO4J_PASSWORD:-}" ]; then
  echo "Error: NEO4J_PASSWORD not set. Load .env first: source .env"
  exit 1
fi

# Verify seed.cypher exists
if [ ! -f "api/seed.cypher" ]; then
  echo "Error: api/seed.cypher not found"
  exit 1
fi

# Pipe seed.cypher into neo4j via docker compose exec
echo "Seeding Neo4j with recipe fixture..."
docker compose exec -T neo4j cypher-shell -u "$NEO4J_USER" -p "$NEO4J_PASSWORD" < api/seed.cypher

echo "✓ Neo4j seeded successfully"
