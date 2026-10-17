import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { convert } from "../scripts/import-legacy-tournaments.mjs";

test("legacy tournament import is deterministic, unpublished and injection-safe", async () => {
  const dir = await mkdtemp(join(tmpdir(), "esc-import-"));
  try {
    const event = {
      _id: { $oid: "507f1f77bcf86cd799439011" },
      name: "O'Connor Mobile Legends Cup",
      description: "A real legacy tournament requiring manual review before publication.",
      game: "Mobile Legends: Bang Bang",
      format: "Single Elimination",
      location: "Online",
      organizer: "Community",
      startDate: { $date: "2026-10-25T12:00:00.000Z" },
      registrationDeadline: { $date: "2026-10-24T12:00:00.000Z" },
      maxSquads: 32, prizePool: 0, status: "registration_closed",
    };
    const input = join(dir, "export.json"), output = join(dir, "out.sql");
    await writeFile(input, JSON.stringify([event, event, { ...event, _id: "invalid" }]));
    const report = await convert(input, output);
    assert.equal(report.inputCount, 3);
    assert.equal(report.imported, 1);
    assert.equal(report.skipped, 2);
    assert.equal(report.requiresReview, 1);
    const sql = await readFile(output, "utf8");
    assert.match(sql, /INSERT OR IGNORE INTO tournaments/);
    assert.equal(sql.includes("O'Connor"), false);
    assert.match(sql, /,0,CAST\(X'/);
    await assert.rejects(() => convert(input, output), /EEXIST/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
