"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, CalendarDays, ChevronRight, Gamepad2, MapPin, Search, ShieldCheck, Sparkles, Trophy, Users } from "lucide-react";

type TournamentStatus = "upcoming" | "registration_open" | "ongoing" | "completed" | "cancelled";
type Tournament = {
  id: string;
  title: string;
  description: string;
  format: string;
  venue: string;
  organizer: string;
  game: string;
  status: TournamentStatus;
  starts_at: string;
  registration_closes_at: string | null;
  max_teams: number;
  prize_pool_mnt: number;
  registration_url: string;
};

const statusLabels: Record<TournamentStatus, string> = {
  upcoming: "Удахгүй",
  registration_open: "Бүртгэл нээлттэй",
  ongoing: "Явагдаж байна",
  completed: "Дууссан",
  cancelled: "Цуцлагдсан",
};

const statusStyles: Record<TournamentStatus, string> = {
  upcoming: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  registration_open: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  ongoing: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  completed: "border-white/10 bg-white/5 text-slate-300",
  cancelled: "border-rose-400/30 bg-rose-400/10 text-rose-200",
};

function isTournament(value: unknown): value is Tournament {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Tournament>;
  return typeof item.id === "string" && typeof item.title === "string" &&
    typeof item.description === "string" && typeof item.game === "string" &&
    typeof item.format === "string" && typeof item.starts_at === "string" &&
    typeof item.max_teams === "number" && typeof item.prize_pool_mnt === "number" &&
    typeof item.status === "string" && item.status in statusLabels;
}

function dateText(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Огноо тодорхойгүй";
  return new Intl.DateTimeFormat("mn-MN", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function moneyText(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) return "Шагналын мэдээлэл ороогүй";
  return amount.toLocaleString("mn-MN") + " ₮";
}

export default function TournamentsPage() {
  const [events, setEvents] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<TournamentStatus | "all">("all");
  const [game, setGame] = useState("all");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/community/tournaments", { signal: controller.signal, cache: "no-store" });
        const data: { success?: boolean; message?: string; tournaments?: unknown[] } = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.tournaments)) {
          throw new Error(data.message || "Тэмцээнүүдийг ачаалж чадсангүй.");
        }
        setEvents(data.tournaments.filter(isTournament));
        setError("");
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Тэмцээнүүдийг ачаалж чадсангүй.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  const games = useMemo(() => Array.from(new Set(events.map((item) => item.game))).sort(), [events]);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return events.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (game !== "all" && item.game !== game) return false;
      if (!query) return true;
      return [item.title, item.game, item.description, item.organizer].some((value) => value.toLocaleLowerCase().includes(query));
    });
  }, [events, game, search, status]);

  return (
    <div className="min-h-screen bg-[#080d19] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgba(99,53,195,0.26),transparent_45%),radial-gradient(ellipse_at_10%_100%,rgba(10,149,192,0.11),transparent_48%)]" />
        <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-12 sm:px-8 sm:pb-20 sm:pt-16">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">Нүүр <ChevronRight size={15} /> Тэмцээнүүд</Link>
          <div className="grid gap-10 lg:grid-cols-[1fr_0.6fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-bold tracking-widest text-violet-200">
                <Sparkles size={14} /> COMPETITIVE ARENA
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">Дараагийн <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">ялалт эндээс.</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300">Монголын esports тэмцээнүүдийн мэдээлэл. Бүртгэл, эхлэх хугацаа болон тэмцээний нөхцөлийг бодит мэдээлэл нийтлэгдсэн үед эндээс харна.</p>
              <Link href="/feedback" className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10">Тэмцээний санал илгээх <ArrowRight size={18} /></Link>
            </div>
            <div className="relative hidden min-h-[260px] items-center justify-center rounded-[2rem] border border-violet-400/20 bg-gradient-to-br from-[#1e1a43] via-[#17152c] to-[#102d3c] shadow-2xl shadow-violet-900/10 lg:flex">
              <div className="absolute inset-0 rounded-[2rem] opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
              <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-violet-300/20 bg-violet-400/10 shadow-[0_0_90px_rgba(118,80,230,0.3)]"><Trophy size={92} strokeWidth={1.1} className="text-violet-200" /></div>
              <span className="absolute bottom-7 left-7 text-xs font-black tracking-[0.2em] text-cyan-200">PLAY • COMPETE • CONNECT</span>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-2xl font-black sm:text-3xl">Тэмцээний хуваарь</h2><p className="mt-2 text-sm text-slate-400">Зөвхөн нийтлэгдсэн, баталгаатай мэдээллийг харуулна.</p></div>
          {!loading && !error && <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">{events.length} нийтлэгдсэн тэмцээн</span>}
        </div>

        {!loading && !error && events.length > 0 && (
          <div className="mb-8 grid gap-3 rounded-2xl border border-white/10 bg-[#10182a] p-4 sm:grid-cols-[1fr_190px_190px] sm:p-5">
            <label className="relative block"><span className="sr-only">Тэмцээн хайх</span><Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Тэмцээн, тоглоом эсвэл зохион байгуулагч..." className="w-full rounded-xl border border-white/10 bg-[#080d19] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400" /></label>
            <label><span className="sr-only">Төлөвөөр шүүх</span><select value={status} onChange={(event) => setStatus(event.target.value as TournamentStatus | "all")} className="h-full min-h-12 w-full rounded-xl border border-white/10 bg-[#080d19] px-3 text-sm text-white"><option value="all">Бүх төлөв</option>{(Object.keys(statusLabels) as TournamentStatus[]).map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}</select></label>
            <label><span className="sr-only">Тоглоомоор шүүх</span><select value={game} onChange={(event) => setGame(event.target.value)} className="h-full min-h-12 w-full rounded-xl border border-white/10 bg-[#080d19] px-3 text-sm text-white"><option value="all">Бүх тоглоом</option>{games.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          </div>
        )}

        {loading ? (
          <div role="status" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl border border-white/5 bg-white/5" />)}</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-amber-300/20 bg-amber-300/5 px-6 py-14 text-center">
            <AlertCircle className="mx-auto mb-4 text-amber-300" size={38} />
            <h3 className="text-xl font-bold">Тэмцээний мэдээлэл түр боломжгүй</h3>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-300">{error}</p>
            <p className="mt-3 text-xs text-slate-400">Мэдээлэл зохиож харуулахгүй. Үйлчилгээ холбогдсоны дараа жинхэнэ тэмцээнүүд гарч ирнэ.</p>
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-[#10182a] px-6 py-16 text-center">
            <Trophy className="mx-auto mb-5 text-violet-300" size={48} strokeWidth={1.4} />
            <h3 className="text-2xl font-bold">Одоогоор нийтэлсэн тэмцээн алга</h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-400">Шинэ тэмцээний мэдээлэл баталгаажсаны дараа энд харагдана. Тэмцээн зохион байгуулах санаа байвал санал илгээгээрэй.</p>
            <Link href="/feedback" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-bold text-white transition hover:bg-violet-400">Санал илгээх <ArrowRight size={18} /></Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center text-slate-400">Таны хайлтад тохирох тэмцээн олдсонгүй.</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const canRegister = item.status === "registration_open" && item.registration_url.startsWith("https://");
              return (
                <article key={item.id} className="group flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#10182a] transition hover:-translate-y-1 hover:border-violet-400/30 hover:shadow-xl hover:shadow-violet-900/10">
                  <div className="relative flex min-h-32 items-center justify-between overflow-hidden border-b border-white/10 bg-gradient-to-br from-violet-900/30 via-[#19203a] to-cyan-900/20 p-6">
                    <div className="absolute -right-4 -top-5 h-36 w-36 rounded-full border-[20px] border-white/5" />
                    <Gamepad2 className="relative text-violet-200" size={48} strokeWidth={1.4} />
                    <span className={"relative rounded-full border px-3 py-1.5 text-xs font-semibold " + statusStyles[item.status]}>{statusLabels[item.status]}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">{item.game}</p>
                    <h3 className="mt-2 text-xl font-black leading-snug">{item.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{item.description}</p>
                    <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm text-slate-300">
                      <div className="flex items-start gap-3"><CalendarDays size={17} className="mt-0.5 shrink-0 text-violet-300" /><span>{dateText(item.starts_at)} (Улаанбаатар)</span></div>
                      <div className="flex items-start gap-3"><Users size={17} className="mt-0.5 shrink-0 text-violet-300" /><span>{item.max_teams} баг · {item.format}</span></div>
                      <div className="flex items-start gap-3"><MapPin size={17} className="mt-0.5 shrink-0 text-violet-300" /><span>{item.venue}</span></div>
                      <div className="flex items-start gap-3"><Trophy size={17} className="mt-0.5 shrink-0 text-amber-300" /><span>{moneyText(item.prize_pool_mnt)}</span></div>
                    </div>
                    <div className="mt-auto pt-7">
                      {canRegister ? (
                        <a href={item.registration_url} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-400">Бүртгүүлэх <ArrowRight size={17} /></a>
                      ) : (
                        <div className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-400"><ShieldCheck size={17} /> {item.status === "registration_open" ? "Бүртгэлийн холбоос ороогүй" : "Бүртгэл одоогоор нээлтгүй"}</div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
