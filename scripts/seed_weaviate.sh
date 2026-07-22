#!/usr/bin/env bash
# Seed the running Weaviate container with the chunked-docs fixture.
#
# Idempotent — the Python seeder skips chunk_ids already present.
# Expected runtime: ~10–45 seconds depending on whether embeddings are pre-baked.
#
# Usage: bash scripts/seed_weaviate.sh (from repo root with stack running)

set -euo pipefail

# Verify seed_weaviate.py exists
if [ ! -f "api/seed_weaviate.py" ]; then
  echo "Error: api/seed_weaviate.py not found"
  exit 1
fi

# Verify seed_chunks.json exists
if [ ! -f "api/seed_chunks.json" ]; then
  echo "Error: api/seed_chunks.json not found"
  exit 1
fi

# Run the seeder inside the api container 
# (requirements: sentence-transformers, weaviate-client live in the api image)
echo "Seeding Weaviate with chunked-docs fixture..."
docker compose exec -T api python seed_weaviate.py

echo "✓ Weaviate seeded successfully"
