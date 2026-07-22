"""End-to-end smoke harness — Infra-Integration lead authors.

Brings the four-service stack up via `docker compose up -d --wait` and
verifies the demo `/rag/answer` curl returns 200 with citations against
the seeded fixture. Skipped in the autograder (which exercises compose
topology structurally, not at runtime); used locally during demo-prep
and by the TA during walkthrough.
"""
import json
import os
import subprocess
import time

import pytest
import requests


@pytest.mark.skip(reason="Manual e2e test — requires 'docker compose up -d --build' running locally")
def test_stack_e2e_seeded_rag_query():
    """Smoke test: stack up → seed → demo RAG query returns cited answer."""
    api_url = os.getenv("API_URL", "http://localhost:8000")
    max_retries = 30
    retry_interval = 2
    
    # Wait for API to be ready
    for attempt in range(max_retries):
        try:
            response = requests.get(f"{api_url}/healthz", timeout=2)
            if response.status_code == 200:
                print("✓ API is ready")
                break
        except requests.RequestException:
            if attempt == max_retries - 1:
                raise AssertionError(f"API not ready after {max_retries * retry_interval}s")
            time.sleep(retry_interval)
    
    # Test the seeded RAG endpoint
    question = "How do I prep ginger for stir-fry?"
    response = requests.post(
        f"{api_url}/rag/answer",
        json={"question": question, "k": 4},
        timeout=10,
    )
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    data = response.json()
    
    # Verify response shape
    assert "answer" in data, "Response missing 'answer' field"
    assert "citations" in data, "Response missing 'citations' field"
    assert "confidence" in data, "Response missing 'confidence' field"
    
    # Verify answer is not empty and not the sentinel
    assert data["answer"], "Answer is empty"
    assert data["answer"] != "I cannot answer this from the available sources", "Got empty-retrieval sentinel"
    
    # Verify citations are present
    assert len(data["citations"]) > 0, "Expected at least one citation"
    
    # Verify each citation has required fields
    for citation in data["citations"]:
        assert "chunk_id" in citation, "Citation missing 'chunk_id'"
        assert "score" in citation, "Citation missing 'score'"
        assert isinstance(citation["chunk_id"], int), "chunk_id should be int"
        assert isinstance(citation["score"], float), "score should be float"
        assert 0 <= citation["score"] <= 1, f"score out of range: {citation['score']}"
    
    # Verify confidence
    assert 0 <= data["confidence"] <= 1, f"confidence out of range: {data['confidence']}"
    assert data["confidence"] > 0, "confidence should be > 0 for a valid answer"
    
    print(f"✓ Demo RAG query succeeded")
    print(f"  Answer: {data['answer'][:100]}...")
    print(f"  Citations: {data['citations']}")
    print(f"  Confidence: {data['confidence']:.2f}")

