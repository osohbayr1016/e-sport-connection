"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight, Lightbulb, MessageSquarePlus, ShieldCheck, Wrench, Bug, Sparkles } from "lucide-react";

type FeedbackType = "feature" | "bug" | "experience";
type FeedbackStatus = "approved" | "planned" | "in_progress" | "shipped";
type Feedback = {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  alias: string;
  status: FeedbackStatus;
  created_at: string;
};
type ApiResult = { success?: boolean; message?: string; feedback?: Feedback[] };

const categories: { value: FeedbackType; label: string; hint: string }[] = [
  { value: "feature", label: "Шинэ санаа", hint: "Шинэ боломж санал болгох" },
  { value: "bug", label: "Алдаа", hint: "Ажиллахгүй байгаа хэсэг" },
  { value: "experience", label: "Сайжруулалт", hint: "Ашиглахад илүү хялбар болгох" },
];
const statuses: Record<FeedbackStatus, string> = {
  approved: "Хүлээн авсан",
  planned: "Төлөвлөсөн",
  in_progress: "Хөгжүүлж байна",
  shipped: "Хийгдсэн",
};

function isFeedback(value: unknown): value is Feedback {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<Feedback>;
  return typeof entry.id === "string" && typeof entry.title === "string" &&
    typeof entry.description === "string" && typeof entry.created_at === "string" &&
    (entry.status === "approved" || entry.status === "planned" || entry.status === "in_progress" || entry.status === "shipped");
}

export default function FeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [type, setType] = useState<FeedbackType>("feature");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [alias, setAlias] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const abort = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/community/feedback", { signal: abort.signal, cache: "no-store" });
        const data: ApiResult = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.feedback)) throw new Error(data.message || "Ачаалж чадсангүй.");
        setItems(data.feedback.filter(isFeedback));
        setListError("");
      } catch (error) {
        if (abort.signal.aborted) return;
        setListError(error instanceof Error ? error.message : "Ачаалж чадсангүй.");
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => abort.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setFormError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/community/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, title, description, alias, website }),
      });
      const data: ApiResult = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Илгээж чадсангүй.");
      setSuccess(data.message || "Таны санал амжилттай бүртгэгдлээ.");
      setTitle("");
      setDescription("");
      setAlias("");
      setWebsite("");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Илгээж чадсангүй.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080d19] text-white">
      <div className="relative overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute -right-24 -top-36 h-[30rem] w-[30rem] rounded-full bg-violet-700/20 blur-[100px]" />
        <div className="pointer-events-none absolute left-0 top-24 h-72 w-72 rounded-full bg-blue-600/10 blur-[100px]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-14 pt-12 sm:px-8 sm:pb-20 sm:pt-20">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
            Нүүр <ChevronRight size={15} /> Нийтийн санал
          </Link>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold tracking-widest text-violet-200">
            <Sparkles size={14} /> COMMUNITY FIRST
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Энэ платформыг <span className="bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">хамтдаа хөгжүүлье.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Алдаа олсон уу? Шинэ санаа байна уу? Саналаа үлдээгээрэй. Илгээсэн санал бүр хяналтад орж, нийтэд зөвшөөрсний дараа энд харагдана.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2"><ShieldCheck size={15} className="text-emerald-300" /> Бүртгэлгүй илгээнэ</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2"><Lightbulb size={15} className="text-amber-300" /> Нээлттэй саналын жагсаалт</span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12">
        <section aria-labelledby="submit-title">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300"><MessageSquarePlus size={22} /></div>
            <div><h2 id="submit-title" className="text-2xl font-bold">Санал илгээх</h2><p className="text-sm text-slate-400">Таны санал бидний дараагийн шинэчлэл байж болно.</p></div>
          </div>
          <form onSubmit={submit} className="space-y-5 rounded-2xl border border-white/10 bg-[#10182a] p-5 shadow-2xl shadow-black/10 sm:p-7">
            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-slate-200">Саналын төрөл</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {categories.map((category) => (
                  <label key={category.value} className={"cursor-pointer rounded-xl border p-3 text-sm transition " + (type === category.value ? "border-violet-400 bg-violet-400/10 text-white" : "border-white/10 bg-slate-900/40 text-slate-300 hover:border-white/20")}>
                    <input type="radio" className="sr-only" checked={type === category.value} onChange={() => setType(category.value)} />
                    <span className="block font-semibold">{category.label}</span>
                    <span className="mt-1 block text-xs leading-snug text-slate-400">{category.hint}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Гарчиг <span className="text-violet-300">*</span></span>
              <input required minLength={8} maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Жишээ: Багийн профайл дээр хайлт нэмэх" className="w-full rounded-xl border border-white/10 bg-[#0a1120] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-violet-400" />
              <span className="mt-1 block text-right text-xs text-slate-500">{title.length}/100</span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Дэлгэрэнгүй тайлбар <span className="text-violet-300">*</span></span>
              <textarea required minLength={20} maxLength={1200} rows={6} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ямар асуудал тулгарсан, юу өөрчлөгдвөл илүү хэрэгтэй болох талаар бичээрэй..." className="w-full resize-y rounded-xl border border-white/10 bg-[#0a1120] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-violet-400" />
              <span className="mt-1 block text-right text-xs text-slate-500">{description.length}/1200</span>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Нэр эсвэл nickname <span className="font-normal text-slate-500">(заавал биш)</span></span>
              <input maxLength={40} value={alias} onChange={(event) => setAlias(event.target.value)} placeholder="Таны nickname" className="w-full rounded-xl border border-white/10 bg-[#0a1120] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-violet-400" />
            </label>
            <div className="absolute -left-[9999px]" aria-hidden="true"><label>Website<input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label></div>
            {formError && <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{formError}</p>}
            {success && <p role="status" className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200"><CheckCircle2 size={18} className="shrink-0" />{success}</p>}
            <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3.5 font-bold text-white transition hover:bg-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 disabled:cursor-wait disabled:opacity-50">
              {submitting ? "Илгээж байна..." : "Санал илгээх"} <ArrowRight size={18} />
            </button>
            <p className="text-xs leading-relaxed text-slate-400">Саналыг нийтлэхээс өмнө хянана. Хувийн мэдээлэл, нууц үг болон бусдын мэдээллийг энд бичихгүй байхыг хүсье.</p>
          </form>
        </section>

        <section aria-labelledby="ideas-title" className="min-w-0">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300"><Lightbulb size={22} /></div>
            <div><h2 id="ideas-title" className="text-2xl font-bold">Community roadmap</h2><p className="text-sm text-slate-400">Хүлээн авсан, хэрэгжиж буй саналууд</p></div>
          </div>
          {loading ? (
            <div role="status" className="space-y-3">{[1, 2, 3].map((number) => <div key={number} className="h-32 animate-pulse rounded-2xl border border-white/5 bg-white/5" />)}</div>
          ) : listError ? (
            <div role="alert" className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-7">
              <Wrench className="mb-3 text-amber-300" />
              <h3 className="font-bold">Roadmap түр боломжгүй</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">{listError}</p>
              <p className="mt-2 text-xs text-slate-400">Cloudflare үйлчилгээ холбогдсоны дараа саналуудыг харах боломжтой.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center">
              <Lightbulb className="mx-auto mb-4 text-slate-500" size={32} />
              <h3 className="text-lg font-bold">Нийтэлсэн санал одоогоор алга</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">Хүлээн авсан саналуудыг хянасны дараа энд харуулна. Эхний санааг та илгээгээрэй.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <article key={item.id} className="rounded-2xl border border-white/10 bg-[#10182a] p-5 transition hover:border-white/20">
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/15 px-2.5 py-1 text-violet-200">
                      {item.type === "bug" ? <Bug size={13} /> : <Lightbulb size={13} />}
                      {categories.find((c) => c.value === item.type)?.label || "Санал"}
                    </span>
                    <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-cyan-200">{statuses[item.status]}</span>
                  </div>
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300">{item.description}</p>
                  <p className="mt-4 text-xs text-slate-500">{item.alias || "Нэргүй"} · {new Date(item.created_at).toLocaleDateString("mn-MN")}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
