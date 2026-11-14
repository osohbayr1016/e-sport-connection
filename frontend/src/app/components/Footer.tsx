"use client";
import Link from "next/link";
import { ArrowUp, ArrowRight, Gamepad2 } from "lucide-react";
const menus = [
  { name: "Тоглогчид", href: "/players" },
  { name: "Багууд", href: "/squads" },
  { name: "Тэмцээнүүд", href: "/tournaments" },
  { name: "Мэдээ", href: "/news" },
  { name: "Бидний тухай", href: "/about" },
];
export default function Footer() {
  return <footer className="border-t border-white/10 bg-[#0a1020] text-white">
    <div className="mx-auto max-w-7xl px-5 pb-8 pt-14 sm:px-8">
      <div className="grid gap-10 md:grid-cols-[2fr_1fr]">
        <div>
          <Link href="/" className="inline-flex items-center gap-3 text-xl font-black">
            <span className="rounded-xl bg-violet-600 p-2.5"><Gamepad2 size={24} /></span>E-Sport Connection
          </Link>
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-400">Монголын Mobile Legends community. Тоглогчид, багууд, тэмцээн болон шинэ санаануудыг нэгтгэнэ.</p>
          <Link href="/feedback" className="mt-7 inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20">
            Сайт сайжруулах санал өгөх <ArrowRight size={17} />
          </Link>
        </div>
        <nav aria-label="Footer холбоосууд" className="grid grid-cols-2 content-start gap-4 text-sm sm:grid-cols-3 md:grid-cols-2">
          {menus.map(item => <Link key={item.href} href={item.href} className="text-slate-400 transition hover:text-cyan-200">{item.name}</Link>)}
          <Link href="/feedback" className="text-violet-300 hover:text-violet-100">Санал хүсэлт</Link>
        </nav>
      </div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-7">
        <p className="text-xs text-slate-500">© {new Date().getFullYear()} E-Sport Connection · Community driven</p>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-slate-300 hover:bg-white/5" aria-label="Хуудасны эхэнд буцах">
          Дээш буцах <ArrowUp size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  </footer>;
}
