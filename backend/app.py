import argparse, os, re, json, pathlib, sqlite3
from typing import Dict, Optional
import hnswlib
from fastapi import FastAPI, Query, Body
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import uvicorn

BASE_DIR = pathlib.Path(__file__).parent.resolve()
load_dotenv(BASE_DIR / ".env")

INDEX_DIR = pathlib.Path(os.environ.get("UNITY_RAG_INDEX_DIR", BASE_DIR / "index")).resolve()
MODEL_NAME = os.environ.get("RAG_EMBED_MODEL", "intfloat/e5-small-v2")

def db_paths(d: pathlib.Path):
    return (d / "chunks.sqlite", d / "vec.index", d / "vec_meta.json")

DB_PATH, VEC_PATH, VEC_META_PATH = db_paths(INDEX_DIR)
UI_DIR = BASE_DIR / "ui" / "dist"

_embed_cache = {}
def _model():
    if MODEL_NAME in _embed_cache: return _embed_cache[MODEL_NAME]["m"]
    m = SentenceTransformer(MODEL_NAME)
    _embed_cache[MODEL_NAME] = {"m": m, "dim": m.get_sentence_embedding_dimension()}
    return m

def _open_sql():
    con = sqlite3.connect(str(DB_PATH))
    con.execute("PRAGMA journal_mode=WAL")
    con.execute("PRAGMA synchronous=NORMAL")
    return con

def _is_symbol(q: str):
    import re
    return bool(re.search(r"[A-Z][a-z0-9]+[A-Z]|[A-Za-z]+\.[A-Za-z0-9_]+", q))

def _bm25(q: str, version: Optional[str], topn=50):
    if not DB_PATH.exists(): return []
    con = _open_sql(); cur = con.cursor()
    qn = q.strip().replace('"',' ')
    fts = f'({qn}) OR api_symbol:{qn} OR code:{qn}' if _is_symbol(qn) else qn
    if version:
        cur.execute("SELECT rowid, bm25(chunks_fts) as score FROM chunks_fts WHERE chunks_fts MATCH ? AND version=? ORDER BY score LIMIT ?", (fts, version, topn))
    else:
        cur.execute("SELECT rowid, bm25(chunks_fts) as score FROM chunks_fts WHERE chunks_fts MATCH ? ORDER BY score LIMIT ?", (fts, topn))
    rows = cur.fetchall(); con.close()
    return [(rid, -s) for rid, s in rows]

def _vsearch(q: str, topn=50):
    if not VEC_PATH.exists() or not VEC_META_PATH.exists(): return []
    m = _model(); qemb = m.encode([q], normalize_embeddings=True)[0]
    with open(VEC_META_PATH, "r", encoding="utf-8") as f: meta = json.load(f)
    dim = meta["dim"]
    p = hnswlib.Index(space='cosine', dim=dim); p.load_index(str(VEC_PATH)); p.set_ef(128)
    k = min(topn, p.get_current_count()) or 1
    labels, dists = p.knn_query(qemb, k=k); sims = 1 - dists[0]
    return list(zip(labels[0].tolist(), sims.tolist()))

def _rrf(bm, vc, k=60, topn=8):
    scores={}
    for i,(cid,_) in enumerate(bm): scores[cid]=scores.get(cid,0)+1.0/(k+i+1)
    for i,(cid,_) in enumerate(vc): scores[cid]=scores.get(cid,0)+1.0/(k+i+1)
    return [cid for cid,_ in sorted(scores.items(), key=lambda x:x[1], reverse=True)[:topn]]

def _fetch(chunk_ids):
    if not chunk_ids: return []
    con = _open_sql(); cur = con.cursor()
    qmarks = ",".join("?"*len(chunk_ids))
    cur.execute(f"""
      SELECT c.id, c.body, c.api_symbol, c.code_json,
             p.title, p.headings, p.version, p.path, p.is_api, c.chunk_ix
      FROM chunks c
      JOIN pages p ON p.id = c.page_id
      WHERE c.id IN ({qmarks})
    """, chunk_ids)
    rows = cur.fetchall(); con.close()
    order={cid:i for i,cid in enumerate(chunk_ids)}; out=[]
    for (cid, body, api_symbol, code_json, title, headings, version, path, is_api, chunk_ix) in rows:
        try: codes = json.loads(code_json) if code_json else []
        except Exception: codes = []
        out.append({
            "chunk_id": cid, "snippet": (body[:600] + ("…" if len(body)>600 else "")),
            "api_symbol": api_symbol, "code_blocks": codes, "title": title, "headings": headings,
            "version": version, "file_path": path, "is_api": bool(is_api), "chunk_index": chunk_ix
        })
    out.sort(key=lambda r: order.get(r["chunk_id"], 1e9))
    return out

def _list_versions():
    if not DB_PATH.exists(): return []
    con = _open_sql(); cur = con.cursor()
    cur.execute("SELECT DISTINCT version FROM pages ORDER BY version DESC")
    vs = [v for (v,) in cur.fetchall() if v]; con.close(); return vs

app = FastAPI(title="Unity Docs RAG Backend", version="1.0")
if UI_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(UI_DIR), html=True), name="ui")

@app.get("/health")
def health():
    return {
        "status":"ok","index_dir":str(INDEX_DIR),
        "db_exists": DB_PATH.exists(),"vec_exists": VEC_PATH.exists(),"meta_exists": VEC_META_PATH.exists(),
        "indexed_versions_count": len(_list_versions()) if DB_PATH.exists() else 0
    }

@app.post("/set_index_dir")
def set_index_dir(payload: Dict = Body(...)):
    global INDEX_DIR, DB_PATH, VEC_PATH, VEC_META_PATH
    new_dir = pathlib.Path(payload.get("index_dir","")).expanduser().resolve()
    if not new_dir.is_dir(): return JSONResponse({"error":f"Not a directory: {new_dir}"}, status_code=400)
    new_db, new_vec, new_meta = db_paths(new_dir)
    if not new_db.exists() or not new_vec.exists() or not new_meta.exists():
        return JSONResponse({"error":"Missing one or more files in index dir (chunks.sqlite, vec.index, vec_meta.json)."}, status_code=400)
    INDEX_DIR = new_dir; DB_PATH, VEC_PATH, VEC_META_PATH = new_db, new_vec, new_meta
    return {"ok": True, "index_dir": str(INDEX_DIR)}

@app.get("/versions")
def versions():
    return {"indexed": _list_versions(), "suggested": ["6000.2","6000.1","6000.0","2022.3 (legacy)"]}

@app.get("/search")
def search(q: str = Query(..., min_length=1), version: Optional[str] = None, top_k: int = 8):
    has_any = DB_PATH.exists() or (VEC_PATH.exists() and VEC_META_PATH.exists())
    if not has_any:
        return JSONResponse({"error":"Index not found. Place chunks.sqlite, vec.index, vec_meta.json into the 'index' directory or set UNITY_RAG_INDEX_DIR."}, status_code=400)
    bm = _bm25(q, version, topn=50) if DB_PATH.exists() else []
    vc = _vsearch(q, topn=50) if (VEC_PATH.exists() and VEC_META_PATH.exists()) else []
    fused = _rrf(bm, vc, topn=top_k) if (bm or vc) else []
    if not fused:
        if bm: fused = [cid for cid,_ in bm[:top_k]]
        elif vc: fused = [cid for cid,_ in vc[:top_k]]
    res = _fetch(fused)
    if _is_symbol(q): res.sort(key=lambda r: (0 if r["api_symbol"] else 1))
    return {"query": q, "version": version, "results": res}

def main():
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="cmd")
    s = sub.add_parser("serve")
    s.add_argument("--host", type=str, default=os.environ.get("HOST","127.0.0.1"))
    s.add_argument("--port", type=int, default=int(os.environ.get("PORT","8000")))
    args = parser.parse_args()
    if args.cmd == "serve":
        uvicorn.run("app:app", host=args.host, port=args.port, log_level="info")
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
