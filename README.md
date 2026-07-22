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
api/                      Pre-implemented FastAPI backend
web/                      Pre-implemented Next.js frontend
docker-compose.yml        Compose stack configuration
scripts/
  seed_neo4j.sh           Neo4j seeding script
  seed_weaviate.sh        Weaviate seeding script
  healthcheck_stack.sh    Stack health polling
.env.example              Environment template
```

## Quick Start — 8 Steps

### 1. Clone and Setup

```bash
git clone https://github.com/<team-fork>/m10-i10-team-N.git
cd m10-i10-team-N
cp .env.example .env
# Edit .env and set NEO4J_PASSWORD (e.g., 'password123' for local dev)
```

### 2. Build and Start the Stack

```bash
docker compose up -d --build
```

This builds and starts all 4 services:
- **api** (FastAPI on :8000)
- **web** (Next.js on :3000)
- **neo4j** (Neo4j on :7687 Bolt, :7474 HTTP)
- **weaviate** (Weaviate on :8080)

### 3. Verify Services Are Healthy

```bash
docker compose ps
# OR: bash scripts/healthcheck_stack.sh
```

Expected: All 4 services show `healthy` status.

### 4. Seed Neo4j Graph Database

```bash
bash scripts/seed_neo4j.sh
```

Loads recipe graph from `api/seed.cypher` (idempotent).

### 5. Seed Weaviate Vector Index

```bash
bash scripts/seed_weaviate.sh
```

Embeds chunks from `api/seed_chunks.json` and inserts into Weaviate (idempotent).
Expected runtime: ~10–45 seconds.

### 6. Test the Backend API

```bash
curl -X POST http://localhost:8000/rag/answer \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I prep ginger for stir-fry?"}'
```

Expected: HTTP 200 with `answer`, `citations`, `confidence`.

### 7. Open Frontend in Browser

Open **http://localhost:3000/rag** and submit the seeded question.

Expected: Cited answer renders with inline `[1]`, `[2]` citation markers.

### 8. Cleanup

```bash
docker compose down -v
```

The `-v` flag removes volumes for a fresh start next time.

---

## Service URLs

| Service | Host URL | Container URL | Port |
|---------|----------|---------------|------|
| Next.js | http://localhost:3000 | http://web:3000 | 3000 |
| FastAPI | http://localhost:8000 | http://api:8000 | 8000 |
| Neo4j Bolt | bolt://localhost:7687 | bolt://neo4j:7687 | 7687 |
| Neo4j HTTP | http://localhost:7474 | http://neo4j:7474 | 7474 |
| Weaviate | http://localhost:8080 | http://weaviate:8080 | 8080 |

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEO4J_USER` | Neo4j username (default: neo4j) |
| `NEO4J_PASSWORD` | Neo4j password (required) |
| `NEO4J_URI` | Neo4j Bolt endpoint (container: bolt://neo4j:7687) |
| `WEAVIATE_URL` | Weaviate HTTP endpoint (container: http://weaviate:8080) |
| `WEB_ORIGIN` | Frontend origin for CORS (default: http://localhost:3000) |
| `NEXT_PUBLIC_API_URL` | Backend API URL for Next.js (build arg: http://localhost:8000) |

---

## Troubleshooting

### Services not reaching healthy

```bash
docker compose logs api
# Check for HuggingFace downloads on first run (spaCy, flan-t5-base, sentence-transformers)
```

### Seed scripts fail

- Verify stack is running: `docker compose ps`
- Verify all services are `healthy`
- Run from repo root (where `docker-compose.yml` is)

### CORS errors in browser

- Check `WEB_ORIGIN=http://localhost:3000` in `.env`
- Restart api: `docker compose restart api`

### Weaviate insert fails silently

- Verify `DEFAULT_VECTORIZER_MODULE=none` in `docker-compose.yml`
- Verify embeddings are external (via `seed_weaviate.py`)

---

## For the Team

- Each Team Member confirms `docker compose up -d` works locally
- All three role branches merge to `main` via internal PRs with peer review
- Team submission includes:
  - `docker compose ps` output (all healthy)
  - Seed scripts output
  - Demo curl response with citations
  - Screenshot of Next.js `/rag` page with cited answer
  - `TEAM.md` roster
  - Per-role contribution summary
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
