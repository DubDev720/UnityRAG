#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-http://127.0.0.1:8000}"

echo "== GET /health"
curl -sS "$BASE/health" | jq .

echo "== GET /versions"
curl -sS "$BASE/versions" | jq .

echo "== GET /search?q=Rigidbody.AddForce&top_k=3"
curl -sS "$BASE/search?q=Rigidbody.AddForce&top_k=3" | jq .

echo "== POST /set_index_dir (dry run example; change the path!)"
# Edit this path to your real prebuilt index dir before running:
IDX_DIR="${IDX_DIR:-C:\\\\Path\\\\To\\\\Your\\\\index}"
curl -sS -X POST "$BASE/set_index_dir" -H 'content-type: application/json' \
  -d "{\"index_dir\": \"$IDX_DIR\"}" | jq .
