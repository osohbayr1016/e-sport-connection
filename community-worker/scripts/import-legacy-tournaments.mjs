#!/usr/bin/env node
// Offline MongoDB tournament JSON export -> unpublished, idempotent D1 SQL.
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const STATUS = new Set(["upcoming", "registration_open", "ongoing", "completed", "cancelled"]);
const str = (v, min, max) => typeof v === "string" && v.trim().length >= min && v.trim().length <= max && !v.includes("\0") ? v.trim() : null;
const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max ? v : null;
function date(value) {
  if (value === null || value === undefined || value === "") return null;
  if (value && typeof value === "object" && "$date" in value) {
    value = value.$date;
    if (value && typeof value === "object" && "$numberLong" in value) value = Number(value.$numberLong);
  }
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}
function uuid(value) {
  const id = typeof value === "string" ? value : value && typeof value === "object" ? value.$oid : null;
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/i.test(id)) return null;
  const b = createHash("sha256").update("e-sport-connection:legacy-tournament:" + id.toLowerCase()).digest().subarray(0, 16);
  b[6] = (b[6] & 15) | 80;
  b[8] = (b[8] & 63) | 128;
  const h = b.toString("hex");
  return h.slice(0,8)+"-"+h.slice(8,12)+"-"+h.slice(12,16)+"-"+h.slice(16,20)+"-"+h.slice(20);
}
const sqlText = (v) => "CAST(X'" + Buffer.from(v, "utf8").toString("hex") + "' AS TEXT)";
function convertOne(r) {
  if (!r || typeof r !== "object" || Array.isArray(r)) return null;
  const event = {
    id: uuid(r._id),
    title: str(r.name, 8, 120),
    description: str(r.description, 20, 2000),
    format: str(r.format || "Single Elimination", 1, 80),
    venue: str(r.location, 1, 100),
    organizer: str(r.organizer, 1, 80),
    game: str(r.game, 1, 60),
    status: r.status === "registration_closed" ? "upcoming" : r.status,
    starts_at: date(r.startDate),
    registration_closes_at: r.registrationDeadline ? date(r.registrationDeadline) : null,
    max_teams: int(r.maxSquads, 2, 1024),
    prize_pool_mnt: int(r.prizePool, 0, 1_000_000_000),
    requiresReview: r.status === "registration_closed",
  };
  if (Object.entries(event).some(([k,v]) => !["registration_closes_at","requiresReview"].includes(k) && (v === null || v === undefined))) return null;
  if (r.registrationDeadline && !event.registration_closes_at) return null;
  if (!STATUS.has(event.status)) return null;
  return event;
}
function insert(e) {
  const fields = ["id","title","description","format","venue","organizer","game","status","starts_at"];
  const values = fields.map((key) => sqlText(e[key]));
  values.push(e.registration_closes_at ? sqlText(e.registration_closes_at) : "NULL");
  values.push(String(e.max_teams), String(e.prize_pool_mnt), sqlText(""), "0", sqlText(new Date().toISOString()));
  return "INSERT OR IGNORE INTO tournaments (id,title,description,format,venue,organizer,game,status,starts_at,registration_closes_at,max_teams,prize_pool_mnt,registration_url,published,created_at) VALUES (" + values.join(",") + ");";
}
export async function convert(inputFile, outputFile) {
  const input = resolve(inputFile), output = resolve(outputFile);
  if (input === output) throw Error("Input and output must differ");
  if ((await stat(input)).size > 20 * 1024 * 1024) throw Error("Export too large");
  const parsed = JSON.parse(await readFile(input, "utf8"));
  const records = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.tournaments) ? parsed.tournaments : null;
  if (!records || records.length > 5000) throw Error("Expected at most 5000 tournament records");
  const accepted = [], seen = new Set();
  let skipped = 0, requiresReview = 0;
  for (const raw of records) {
    const item = convertOne(raw);
    if (!item || seen.has(item.id)) { skipped++; continue; }
    seen.add(item.id); accepted.push(item);
    if (item.requiresReview) requiresReview++;
  }
  const statements = ["-- Offline import. All records are unpublished.", "BEGIN TRANSACTION;", ...accepted.map(insert), "COMMIT;", ""].join("\n");
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, statements, { encoding: "utf8", mode: 0o600, flag: "wx" });
  return { inputCount: records.length, imported: accepted.length, skipped, requiresReview, output };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4) { console.error("Usage: node scripts/import-legacy-tournaments.mjs input.json output.sql"); process.exitCode = 1; }
  else convert(process.argv[2], process.argv[3]).then((result) => console.log(JSON.stringify(result))).catch((e) => { console.error(e.message); process.exitCode = 1; });
}
