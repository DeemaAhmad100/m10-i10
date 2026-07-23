#!/usr/bin/env bash
# Poll `docker compose ps` until all four services report healthy or
# until the 90s budget expires.
#
# Usage: bash scripts/healthcheck_stack.sh (from repo root with stack running)

set -euo pipefail

SERVICES=("neo4j" "weaviate" "api" "web")
MAX_RETRIES=45
RETRY_INTERVAL=2

echo "Waiting for all services to reach healthy state (max ${MAX_RETRIES} * ${RETRY_INTERVAL}s = 90s)..."

for ((i = 1; i <= MAX_RETRIES; i++)); do
  echo -n "Attempt $i/$MAX_RETRIES... "
  
  # Check if all required services are healthy
  all_healthy=true
  for service in "${SERVICES[@]}"; do
    # Use docker compose ps to check health
    if ! docker compose ps $service 2>/dev/null | grep -q 'healthy'; then
      all_healthy=false
      break
    fi
  done
  
  if [ "$all_healthy" = true ]; then
    echo "✓ All services healthy"
    exit 0
  fi
  
  echo "not ready"
  sleep $RETRY_INTERVAL
done

echo "✗ Timeout waiting for services to reach healthy state"
docker compose ps
exit 1
