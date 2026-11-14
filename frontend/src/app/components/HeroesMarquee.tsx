"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

interface HeroesMarqueeProps {
  heroes: { src: string; alt: string }[];
  height?: number;
  speed?: number; // pixels per second
}

export default function HeroesMarquee({
  heroes,
  height = 120,
  speed = 30,
}: HeroesMarqueeProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let offset = 0;

    const tick = () => {
      offset -= speed / 60; // approx 60fps
      if (offset <= -el.scrollWidth / 2) offset = 0; // seamless loop
      el.style.transform = `translateX(${offset}px)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  const doubled = [...heroes, ...heroes];

  return (
    <div className="relative overflow-hidden">
      {/* Gradient overlays for smooth edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black to-transparent z-10" />

      <div
        className="whitespace-nowrap will-change-transform"
        ref={ref}
        style={{ transform: "translateX(0px)" }}
      >
        {doubled.map((h, i) => (
          <span
            key={`${h.src}-${i}`}
            className="inline-flex items-center justify-center mx-6 group"
          >
            <div
              className="relative"
              style={{ height: height, width: `calc(${height}px * 16 / 9)` }}
            >
              {/* Hero image with glow effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-blue-400/20 to-cyan-400/20 rounded-full blur-lg scale-110 group-hover:scale-125 transition-transform duration-300" />
              <Image
                src={h.src}
                alt={h.alt}
                width={1920}
                height={1080}
                className="relative object-cover drop-shadow-2xl group-hover:scale-110 transition-transform duration-300"
                style={{ width: "100%", height: "100%" }}
                unoptimized
                onError={(e) => {
                  // Fallback to a placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = "/default-avatar.png";
                }}
                onLoad={() => {}}
              />

              {/* Hero name tooltip */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {h.alt.split(" - ")[0]}
                </div>
              </div>
            </div>
          </span>
        ))}
      </div>
    </div>
  );
}
