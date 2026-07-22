# Integration 10 — Dockerize the Four-Service Stack

Compose the Lab's FastAPI backend and Next.js frontend with
**containerized Neo4j and Weaviate** into a one-command Dockerized
stack delivered as a 3-Team-Member team.

> Read the full Integration guide on the cohort site:
> <https://LevelUp-Applied-AI.github.io/aispire-14005-pages/modules/module-10/a0cae6a2>
>
> Team-facing spec:
> <https://LevelUp-Applied-AI.github.io/aispire-14005-pages/modules/module-10/4ba363ed>

## Team Roles

See [TEAM.md](TEAM.md) for role assignments and the per-role file
checklist. See [CONTRIBUTING.md](CONTRIBUTING.md) for the internal-PR
review convention and the contract-change protocol.

## Starter Layout

```
api/                      Pre-implemented FastAPI backend (do not modify
                          unless extending; the Backend lead extends here)
web/                      Pre-implemented Next.js frontend
docker-compose.yml        Skeleton — Infra-Integration lead authors
scripts/
  seed_neo4j.sh           Stub — Infra-Integration lead authors
  seed_weaviate.sh        Stub — Infra-Integration lead authors
  healthcheck_stack.sh    Stub — Infra-Integration lead authors
.env.example              Placeholder credentials
```

## Quick Start

### Prerequisites

- Docker and Docker Compose installed and running.
- `.env` file created from `.env.example` with `NEO4J_PASSWORD` filled in.

### 1. Clone and Setup

```bash
git clone https://github.com/<team-fork-owner>/m10-i10-team-N.git
cd m10-i10-team-N
cp .env.example .env
# Edit .env and set a strong NEO4J_PASSWORD (e.g., 'password' for local dev)
```

### 2. Build and Start the Stack

```bash
docker compose up -d --build
```

This command:
- Builds the `api` service (FastAPI with Neo4j + Weaviate + spaCy + flan-t5-base)
- Builds the `web` service (Next.js with TypeScript)
- Pulls and starts the `neo4j` service (Neo4j 5 Community)
- Pulls and starts the `weaviate` service (Weaviate 1.24.10)
- Wires service-name DNS, volumes, healthchecks, and ordering constraints

### 3. Verify All Services Are Healthy

```bash
docker compose ps
```

Expected output — all services show `healthy` under the `Status` column:

```
NAME        IMAGE                                  COMMAND                 SERVICE     STATUS
neo4j       neo4j:5-community                      "tini -g -- /startup…" neo4j       running (healthy)
weaviate    semitechnologies/weaviate:1.24.10      "/bin/weaviate --… "   weaviate    running (healthy)
api         m10-i10-team-N-api:latest              "uvicorn api.main:a…" api         running (healthy)
web         m10-i10-team-N-web:latest              "node server.js"       web         running (healthy)
```

Or use the built-in healthcheck script:

```bash
bash scripts/healthcheck_stack.sh
```

### 4. Seed the Neo4j Graph Database

```bash
bash scripts/seed_neo4j.sh
```

This runs the Cypher fixture from `api/seed.cypher` inside the `neo4j` container.
The script is idempotent — re-running does not duplicate nodes.

Expected output:

```
Seeding Neo4j with recipe fixture...
(remaining output)
✓ Neo4j seeded successfully
```

### 5. Seed the Weaviate Vector Index

```bash
bash scripts/seed_weaviate.sh
```

This runs `api/seed_weaviate.py` inside the `api` container.
The seeder embeds the chunks from `api/seed_chunks.json` using `sentence-transformers` 
and inserts them into Weaviate.

Expected runtime: ~10–45 seconds depending on whether embeddings are pre-cached.

Expected output:

```
Seeding Weaviate with chunked-docs fixture...
(embedding progress)
✓ Weaviate seeded successfully
```

### 6. Test the Backend API

```bash
curl -X POST http://localhost:8000/rag/answer \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I prep ginger for stir-fry?"}'
```

Expected response — HTTP 200 with a grounded cited answer:

```json
{
  "answer": "To prep ginger for stir-fry, ...",
  "citations": [
    { "chunk_id": 42, "score": 0.87 },
    { "chunk_id": 53, "score": 0.81 }
  ],
  "confidence": 0.84
}
```

### 7. Test the Frontend in the Browser

Open http://localhost:3000/rag in your browser.

- Type or paste the seeded question: "How do I prep ginger for stir-fry?"
- Click "Submit"
- Observe a cited answer rendered with inline `[1]`, `[2]` citation markers
- Hover/click citations to see the backing text and confidence score

### 8. Tear Down (Cleanup)

```bash
docker compose down -v
```

The `-v` flag removes the named volumes (`neo4j_data`, `weaviate_data`),
ensuring a fresh state on the next `docker compose up`.

## Service URLs (from Host)

- **FastAPI** http://localhost:8000
  - Docs: http://localhost:8000/docs
  - OpenAPI schema: http://localhost:8000/openapi.json
  - Health: http://localhost:8000/healthz
  - Readiness: http://localhost:8000/readyz
- **Next.js** http://localhost:3000
  - `/extract` — entity extraction
  - `/kg` — knowledge graph query
  - `/rag` — RAG answer (main demo)
- **Neo4j** http://localhost:7474 (browser) or `bolt://localhost:7687` (driver)
- **Weaviate** http://localhost:8080

## Service URLs (from Containers)

- **FastAPI**: `http://api:8000`
- **Neo4j Bolt**: `bolt://neo4j:7687`
- **Weaviate**: `http://weaviate:8080`

## Environment Variables

| Variable | Service(s) | Purpose |
| --- | --- | --- |
| `NEO4J_USER` | `neo4j` (healthcheck), `api` | Neo4j username (default: `neo4j`) |
| `NEO4J_PASSWORD` | `neo4j` (auth), `api` (driver), seed scripts | Neo4j password |
| `NEO4J_URI` | `api` | Neo4j Bolt URI (default: `bolt://neo4j:7687`) |
| `WEAVIATE_URL` | `api` | Weaviate HTTP endpoint (default: `http://weaviate:8080`) |
| `WEB_ORIGIN` | `api` (CORS) | Frontend origin for CORS (default: `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | `web` (build arg) | Backend API URL baked into the Next.js bundle (default: `http://localhost:8000`) |

## Idempotency

All seed scripts are idempotent:

- `seed_neo4j.sh` uses `MERGE` and `CREATE CONSTRAINT IF NOT EXISTS` in Cypher.
- `seed_weaviate.sh` checks for existing `chunk_id` before inserting.

Re-running either script multiple times produces the same end state without duplication.

## Troubleshooting

### Services not reaching `healthy` state

1. Check logs: `docker compose logs <service-name>`
   - Example: `docker compose logs api` (watch for HuggingFace downloads on first run)
2. Verify `.env` is loaded: `docker compose config | grep NEO4J_PASSWORD`
3. Verify port availability: `lsof -i :8000` (8000, 3000, 7687, 8080 must be free)

### Seed scripts fail

1. Verify the stack is running: `docker compose ps`
2. Verify all services are `healthy` (not just `running`)
3. Verify `.env` is in the repo root and has `NEO4J_PASSWORD` set
4. Run seed scripts from the repo root (the directory containing `docker-compose.yml`)

### CORS errors in the browser

- Verify `WEB_ORIGIN=http://localhost:3000` in `.env`
- Verify the api `environment:` in `docker-compose.yml` has `WEB_ORIGIN=${WEB_ORIGIN}`
- Restart the api service: `docker compose restart api`

### Weaviate insert silently fails

- Verify `DEFAULT_VECTORIZER_MODULE=none` in the `weaviate` service environment
- Verify embeddings are external (from `sentence-transformers`) — no internal vectorization

## Development Notes

### Adding a New Endpoint

1. **Backend lead** adds the route in `api/main.py` and the shape in `api/models.py`.
2. **Backend lead** announces the OpenAPI shape on the team Slack channel (contract change).
3. **Frontend lead** updates `web/lib/types.ts` to match the new shape.
4. **Frontend lead** adds the typed fetch call in the corresponding page.
5. Both merge to their respective branches via internal PRs reviewed by the other role.

### Memory and Performance

- Neo4j heap: 1 GB (configurable in `docker-compose.yml` via `NEO4J_dbms_memory_heap_max__size`)
- Weaviate data: persisted in named volume `weaviate_data` (survives `docker compose down`)
- API cold start: ~1–5 min on first boot (downloads HuggingFace models; subsequent starts are <1s)

### CI/CD

The autograder runs two workflows:

1. **Structural** — validates `docker-compose.yml` topology, `.env.example`, `TEAM.md`, `CONTRIBUTING.md`, Playwright specs
2. **Stack** — brings up the full stack, runs seed scripts, curls the RAG endpoint, runs Playwright headless, verifies idempotency

Both must pass for the team submission to receive full credit.
TEAM.md                   Team roster — team fills in
CONTRIBUTING.md           Branch convention + internal-PR protocol
```

## Bring up the stack (runbook — Infra-Integration lead drafts this)

```bash
cp .env.example .env  # edit values; never commit .env

docker compose up -d --build
bash scripts/healthcheck_stack.sh
bash scripts/seed_neo4j.sh
bash scripts/seed_weaviate.sh

# Demo curl
curl -s -X POST http://localhost:8000/rag/answer \
  -H 'Content-Type: application/json' \
  -d '{"question": "How do I prep ginger for stir-fry?"}' | jq .

# Open the web UI at http://localhost:3000/rag
```

## Submission

Team submission (one per team): the team submitter pastes the team
fork's main-branch URL into TalentLMS → Module 10 → Integration Task.

Per-Team-Member participation confirmation (one per Team Member): each
Team Member separately submits a TalentLMS checkbox confirming
participation, naming their assigned role, and naming the files they
authored.

---

## License

This repository is provided for educational use only. See
[LICENSE](LICENSE) for terms. You may clone and modify this repository
for personal learning and practice, and reference code you wrote here
in your professional portfolio. Redistribution outside this course is
not permitted.
