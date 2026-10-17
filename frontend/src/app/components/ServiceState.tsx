import Link from "next/link";
import { AlertTriangle, ArrowRight, SearchX } from "lucide-react";
export default function ServiceState({ mode, title, description }: {
  mode: "offline" | "empty"; title: string; description: string;
}) {
  const Icon = mode === "offline" ? AlertTriangle : SearchX;
  return (
    <section role={mode === "offline" ? "alert" : "status"}
      className="mx-auto my-10 max-w-2xl rounded-2xl border border-white/10 bg-[#131b30] p-8 text-center sm:p-12">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300"><Icon size={28} aria-hidden="true" /></span>
      <h3 className="mt-5 text-xl font-bold text-white sm:text-2xl">{title}</h3>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-400">{description}</p>
      <Link href="/feedback" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-400">
        Санал хүсэлт илгээх <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}
