#!/usr/bin/env python3
"""Check D1 migrations with SQLite."""
import sqlite3
from pathlib import Path
root = Path(__file__).resolve().parents[1]
db = sqlite3.connect(":memory:")
for path in sorted((root / "migrations").glob("*.sql")):
    db.executescript(path.read_text(encoding="utf-8"))
query = "INSERT INTO feedback_limits (fingerprint,day,count) VALUES (?,?,1) ON CONFLICT(fingerprint,day) DO UPDATE SET count=count+1 WHERE count<3 RETURNING count"
assert [db.execute(query, ("hash", "2026-10-18")).fetchone() for _ in range(4)] == [(1,), (2,), (3,), None]
assert db.execute("SELECT COUNT(*) FROM tournaments").fetchone()[0] == 0
print("Migrations: PASS")
