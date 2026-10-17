import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Bug, Crown, Gamepad2, Lightbulb, MessageSquareText, ShieldCheck, Swords, Trophy, Users, Zap } from "lucide-react";

const features = [
  { icon: Users, title: "Баг ба тоглогчид", description: "Хамт тоглох хүмүүсээ олох, өөрийн баг болон ур чадвараа харуулах орон зай.", href: "/players", label: "Тоглогчдыг харах" },
  { icon: Trophy, title: "Тэмцээний төв", description: "Нээлттэй болон дараагийн тэмцээнүүдийг нэг дороос хайж олох хэсэг.", href: "/tournaments", label: "Тэмцээнүүд" },
  { icon: Swords, title: "Squad community", description: "Найзуудтайгаа нэгдэж, squad бүрдүүлж, багийн амжилтаа ахиулаарай.", href: "/squads", label: "Багуудыг харах" },
  { icon: Lightbulb, title: "Таны санаа = дараагийн update", description: "Алдаа, хүсэлт, сайжруулалтын саналаа илгээж, батлагдсан саналуудыг дагаарай.", href: "/feedback", label: "Санал илгээх" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#070c18] text-white">
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_72%_25%,rgba(75,41,175,0.26),transparent_44%),radial-gradient(ellipse_at_6%_95%,rgba(17,126,161,0.13),transparent_47%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px)", backgroundSize: "70px 70px" }} />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 pb-20 pt-16 sm:px-8 lg:min-h-[650px] lg:grid-cols-[1fr_0.95fr] lg:items-center lg:gap-16 lg:py-24">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-400/10 px-3 py-2 text-xs font-bold tracking-[0.14em] text-violet-200">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" /> MONGOLIAN MOBILE LEGENDS COMMUNITY
            </span>
            <h1 className="mt-8 max-w-2xl text-5xl font-black leading-[1.07] tracking-tight sm:text-6xl xl:text-7xl">
              Тоглоомоос илүү. <span className="bg-gradient-to-r from-[#9be8ff] via-[#a0a7ff] to-[#d6a3ff] bg-clip-text text-transparent">Нэг community.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Тоглогчид, багууд, Mobile Legends-ийн тэмцээн болон хамтын хөгжүүлэлт нэг дор. E-Sport Connection шинэ шатандаа шилжиж байна.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/feedback" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-500 px-6 py-3 font-bold text-white shadow-lg shadow-violet-600/15 transition hover:-translate-y-0.5 hover:bg-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200">
                Community-г хөгжүүлье <ArrowRight size={19} />
              </Link>
              <Link href="/tournaments" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:border-white/40 hover:bg-white/10">
                Тэмцээнүүд <ArrowUpRight size={18} />
              </Link>
            </div>
            <p className="mt-8 flex items-start gap-2 text-sm leading-6 text-slate-400">
              <ShieldCheck size={17} className="mt-1 shrink-0 text-cyan-300" />
              Платформ шинэчлэгдэж байгаа тул зарим хуучин боломж түр хязгаарлагдсан байж болно.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none" aria-label="Mobile Legends heroes">
            <div className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-tr from-violet-700/25 via-indigo-500/10 to-cyan-700/20 blur-3xl" />
            <div className="relative grid aspect-[1.25/1] grid-cols-5 gap-3 overflow-hidden rounded-[2rem] border border-white/10 bg-[#101831] p-3 shadow-[0_25px_100px_rgba(0,0,0,0.5)] sm:gap-4 sm:p-4">
              <div className="relative col-span-3 overflow-hidden rounded-[1.4rem] bg-gradient-to-tr from-[#35215d] to-[#111f43]">
                <Image src="/heroes/akai.jpg" alt="Mobile Legends hero Akai" fill priority sizes="(max-width: 1024px) 50vw, 28vw" className="object-cover opacity-90" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#080d19] to-transparent p-5 pt-24">
                  <span className="text-[10px] font-bold tracking-[0.24em] text-cyan-200">HERO SPOTLIGHT</span>
                  <p className="mt-1 text-xl font-black">AKAI</p>
                </div>
              </div>
              <div className="col-span-2 grid gap-3 sm:gap-4">
                <div className="relative overflow-hidden rounded-[1.4rem] bg-indigo-900/40">
                  <Image src="/heroes/aldous.jpg" alt="Mobile Legends hero Aldous" fill sizes="(max-width: 1024px) 35vw, 18vw" className="object-cover" />
                </div>
                <div className="relative overflow-hidden rounded-[1.4rem] bg-fuchsia-900/40">
                  <Image src="/heroes/alucard.jpg" alt="Mobile Legends hero Alucard" fill sizes="(max-width: 1024px) 35vw, 18vw" className="object-cover" />
                </div>
              </div>
              <div className="absolute bottom-6 right-6 flex items-center gap-2 rounded-xl border border-white/20 bg-[#090f22]/90 px-3 py-2 text-xs font-bold text-slate-100 shadow-xl backdrop-blur">
                <Gamepad2 size={17} className="text-violet-300" /> LAND OF DAWN
              </div>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-white/10 bg-[#141d37] p-4 shadow-2xl sm:block">
              <div className="flex items-center gap-3"><div className="rounded-xl bg-cyan-500/15 p-2.5 text-cyan-200"><Zap size={22} /></div><div><p className="text-xs text-slate-400">Built for the community</p><p className="font-bold">Made to evolve</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="text-xs font-bold tracking-[0.2em] text-cyan-300">YOUR ARENA</span>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Өөрийн орон зайгаа олоорой.</h2>
            <p className="mt-3 max-w-2xl text-slate-400">Тэмцээнд оролцохоос эхлээд платформын дараагийн боломжийг санал болгох хүртэл.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link href={feature.href} key={feature.title} className="group flex min-h-[260px] flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-[#121b31] to-[#0e1527] p-6 transition hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-2xl hover:shadow-violet-900/10">
                <span className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-violet-300 transition group-hover:bg-violet-500/20"><Icon size={25} /></span>
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">{feature.description}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">{feature.label} <ArrowRight size={15} className="transition group-hover:translate-x-1" /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0e1629]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200"><MessageSquareText size={15} /> YOU DECIDE WHAT'S NEXT</div>
            <h2 className="mt-6 text-3xl font-black leading-tight sm:text-5xl">Таны санал платформыг өөрчилнө.</h2>
            <p className="mt-5 max-w-xl leading-7 text-slate-300">Бид том хэмжээний баггүй ч хэрэглэгчдийнхээ саналаар бодитой, хэрэгтэй шинэчлэлтүүд хийхийг зорьж байна. Ямар нэг зүйл ажиллахгүй байна уу? Саналаа үлдээгээрэй.</p>
            <Link href="/feedback" className="mt-7 inline-flex items-center gap-2 text-base font-bold text-cyan-200 hover:text-white">Санал хүсэлтийн төв <ArrowRight size={18} /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#131e35] p-6">
              <Bug className="mb-5 text-rose-300" size={28} />
              <h3 className="text-lg font-bold">Алдаа мэдээлэх</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Ажиллахгүй байгаа хэсгийг тодорхой бичиж мэдээлээрэй.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#131e35] p-6">
              <Crown className="mb-5 text-amber-300" size={28} />
              <h3 className="text-lg font-bold">Шинэ боломж санал болгох</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Өөрт хэрэгтэй дараагийн функцийг хамтдаа тодорхойлъё.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-5 px-5 py-14 sm:px-8 md:flex-row md:items-center">
        <div><h2 className="text-2xl font-black">Багтаа нэгдэх цаг.</h2><p className="mt-2 text-sm text-slate-400">E-Sport Connection · Монголын Mobile Legends community</p></div>
        <Link href="/players" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-semibold transition hover:border-violet-300/50 hover:bg-white/5">Тоглогчид <ArrowRight size={17} /></Link>
      </section>
    </div>
  );
}
