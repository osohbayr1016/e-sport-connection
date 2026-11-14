"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, RefreshCw, ShieldCheck, Trophy, Users } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { API_ENDPOINTS } from "../../config/api";

type Event = {
  _id: string;
  name: string;
  game: string;
  startDate: string;
  status: string;
};

type Registration = {
  _id: string;
  tournament: Event | null;
  squad: { _id: string; name: string; tag?: string } | null;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  approvalStatus: "pending" | "approved" | "rejected";
  isApproved: boolean;
  checkedInAt?: string;
};

const date = (value: string) => {
  const time = new Date(value);
  return Number.isNaN(time.getTime()) ? "Огноо тодорхойгүй" : new Intl.DateTimeFormat("mn-MN", {
    timeZone: "Asia/Ulaanbaatar", month: "long", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(time);
};

const checkInAvailable = (entry: Registration) => {
  if (!entry.tournament || !entry.isApproved || entry.paymentStatus !== "paid" || entry.checkedInAt) return false;
  if (!["upcoming", "registration_open", "registration_closed"].includes(entry.tournament.status)) return false;
  const start = Date.parse(entry.tournament.startDate);
  return Number.isFinite(start) && Date.now() >= start - 86400000 && Date.now() < start;
};

export default function MyTournamentsPage() {
  const { user, loading: authLoading, getToken } = useAuth();
  const [entries, setEntries] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async (signal?: AbortSignal) => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    setLoading(true); setError("");
    try {
      const response = await fetch(API_ENDPOINTS.TOURNAMENT_REGISTRATIONS.MY, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal,
      });
      const payload = await response.json();
      if (!response.ok || payload.success !== true || !Array.isArray(payload.registrations)) {
        throw new Error(payload.message || "Бүртгэлийн мэдээллийг авч чадсангүй.");
      }
      setEntries(payload.registrations);
    } catch (err) {
      if (signal?.aborted) return;
      setError(err instanceof Error ? err.message : "Сүлжээний алдаа гарлаа.");
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [getToken]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setEntries([]); setLoading(false); return; }
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [user?.id, authLoading, load]);

  const checkIn = async (id: string) => {
    const token = getToken();
    if (!token) { setError("Нэвтрэх шаардлагатай."); return; }
    setWorkingId(id); setMessage(""); setError("");
    try {
      const response = await fetch(API_ENDPOINTS.TOURNAMENT_REGISTRATIONS.CHECK_IN(id), {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Check-in амжилтгүй.");
      setEntries(current => current.map(item => item._id === id ? { ...item, checkedInAt: data.checkedInAt } : item));
      setMessage("Check-in амжилттай бүртгэгдлээ.");
    } catch (err) { setError(err instanceof Error ? err.message : "Check-in амжилтгүй."); }
    finally { setWorkingId(null); }
  };

  return (
    <main className="min-h-screen bg-[#080d19] px-5 pb-24 pt-28 text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-8 text-sm text-slate-400" aria-label="Breadcrumb">
          <Link href="/tournaments" className="hover:text-white">Тэмцээнүүд</Link> / Миний тэмцээн
        </nav>
        <header className="mb-10 flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-sm text-violet-300"><Trophy size={17} /> Миний тэмцээн</div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Бүртгэл болон check-in</h1>
            <p className="mt-3 max-w-2xl text-slate-400">Оролцох тэмцээн, төлбөрийн баталгаажуулалт болон ирцийн төлөвөө нэг дор харна.</p>
          </div>
          {user && <button type="button" onClick={() => void load()} disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-50">
            <RefreshCw size={16} /> Шинэчлэх
          </button>}
        </header>

        {message && <p role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-emerald-200">{message}</p>}
        {error && <div role="alert" className="mb-5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-4 text-rose-200">{error}</div>}

        {!authLoading && !user ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
            <ShieldCheck className="mb-4 text-violet-300" />
            <h2 className="text-xl font-semibold">Бүртгэлээ харахын тулд нэвтэрнэ үү</h2>
            <p className="mt-2 text-slate-400">Таны багийн тэмцээний мэдээлэл зөвхөн танд харагдана.</p>
            <Link className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500" href="/auth/login">Нэвтрэх</Link>
          </section>
        ) : loading || authLoading ? (
          <p role="status" className="rounded-2xl border border-white/10 bg-white/5 p-8 text-slate-300">Бүртгэлүүдийг ачаалж байна…</p>
        ) : entries.length === 0 && !error ? (
          <section className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <Trophy className="mx-auto mb-4 text-slate-400" size={32} />
            <h2 className="text-xl font-semibold">Одоогоор бүртгэл алга</h2>
            <p className="mx-auto mt-2 max-w-md text-slate-400">Тэмцээний жагсаалтаас өөрийн багийн оролцох тэмцээнийг сонгоно уу.</p>
            <Link href="/tournaments" className="mt-6 inline-flex rounded-xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500">Тэмцээн үзэх</Link>
          </section>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => (
              <article key={entry._id} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-7">
                <div className="flex flex-wrap justify-between gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-violet-300">{entry.tournament?.game || "Тоглоом тодорхойгүй"}</p>
                    <h2 className="text-xl font-bold">{entry.tournament?.name || "Тэмцээн олдсонгүй"}</h2>
                    <p className="flex items-center gap-2 text-sm text-slate-400"><Users size={16} /> {entry.squad?.name || "Баг олдсонгүй"}</p>
                    {entry.tournament && <p className="flex items-center gap-2 text-sm text-slate-400"><CalendarDays size={16} /> {date(entry.tournament.startDate)}</p>}
                  </div>
                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span className={"rounded-full border px-3 py-1 text-xs font-semibold " + (entry.isApproved ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200" : "border-amber-400/30 bg-amber-400/10 text-amber-200")}>
                      {entry.isApproved ? "Баталгаажсан" : entry.approvalStatus === "rejected" ? "Татгалзсан" : "Зөвшөөрөл хүлээж байна"}
                    </span>
                    <span className="text-xs text-slate-400">Төлбөр: {entry.paymentStatus === "paid" ? "Баталгаажсан" : entry.paymentStatus === "pending" ? "Хүлээгдэж байна" : entry.paymentStatus}</span>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    {entry.checkedInAt ? <><CheckCircle2 className="text-emerald-400" size={18} /> Check-in хийсэн</>
                      : <><Clock3 className="text-slate-400" size={18} /> Check-in тэмцээн эхлэхээс 24 цагийн өмнө нээгдэнэ</>}
                  </div>
                  {checkInAvailable(entry) ? (
                    <button type="button" disabled={workingId === entry._id} onClick={() => void checkIn(entry._id)}
                      className="min-h-11 rounded-xl bg-violet-600 px-5 py-2 font-bold hover:bg-violet-500 disabled:opacity-50">
                      {workingId === entry._id ? "Бүртгэж байна…" : "Check-in хийх"}
                    </button>
                  ) : entry.tournament ? (
                    <Link href={`/tournaments/${entry.tournament._id}`} className="inline-flex min-h-11 items-center rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10">Тэмцээний мэдээлэл</Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
